import { EditorView, basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

import { EditorState } from '@codemirror/state'
import readOnlyRangesExtension from 'codemirror-readonly-ranges'

import {
    Dmd,
    DotShape,
    AnimationLayer,
    CanvasLayer,
    Easing,
    EasingFunction,
    SpritesLayer,
    VideoLayer,
    TextLayer
} from "h5dmd";

type LayerKind = 'canvas' | 'animation' | 'video' | 'sprites' | 'text';

interface LayerDescriptor {
    id: string;
    label: string;
    kind: LayerKind;
    spriteId?: string;
    note?: string;
}

const layerDescriptors: LayerDescriptor[] = [
    {id: 'bg', label: 'Background', kind: 'canvas'},
    {id: 'animation', label: 'Animation', kind: 'animation'},
    {id: 'video-transparent', label: 'Video (transparent)', kind: 'video'},
    {id: 'video-chromakey', label: 'Video (chroma key)', kind: 'video'},
    {id: 'matthew', label: 'Matthew img', kind: 'canvas'},
    {id: 'sprite', label: 'Sprite', kind: 'sprites', spriteId: 'scott'},
    {id: 'text1', label: 'Text: Scott', kind: 'text'},
    {id: 'text2', label: 'Text: VS in', kind: 'text'},
    {id: 'text3', label: 'Text: VS out', kind: 'text'},
    {id: 'text4', label: 'Text: Matthew', kind: 'text'}
];

function getReadOnlyRanges(targetState: EditorState) {
  const doc = targetState.doc
  const secondLine = doc.line(2)
  const lastLine = doc.line(doc.lines)

  return [
    { from: 0, to: secondLine.to + 1 },
    { from: lastLine.from, to: lastLine.to }
  ]
}

function getEditableContent(state: EditorState): string {
  const doc = state.doc
  if (doc.lines <= 3) return '' // nothing editable if only header/footer exist

  const startLine = doc.line(3)        // first editable line (after 2 locked lines)
  const endLine = doc.line(doc.lines - 1) // last editable line

  return doc.sliceString(startLine.from, endLine.to)
}



/**
 * Build the tabbed per-layer control panel for the given Dmd instance.
 * Layers must already be added to the Dmd before calling this.
 */
export function buildControlPanel(dmd: Dmd): void {

    const tabBar = document.getElementById('tab-bar') as HTMLDivElement;
    const tabPanels = document.getElementById('tab-panels') as HTMLDivElement;
    const tabs: { button: HTMLButtonElement; panel: HTMLDivElement; layerId?: string }[] = [];

    const activateTab = (index: number) => {
        tabs.forEach((t, i) => {
            t.button.classList.toggle('active', i === index);
            t.panel.classList.toggle('active', i === index);
        });
    };

    const addTab = (label: string, build: (panel: HTMLDivElement) => void, layerId?: string) => {
        const button = document.createElement('button');
        button.textContent = label;
        const panel = document.createElement('div');
        panel.className = 'tab-panel';
        build(panel);
        const index = tabs.length;
        button.addEventListener('click', () => activateTab(index));
        tabBar.appendChild(button);
        tabPanels.appendChild(panel);
        tabs.push({button, panel, layerId});

        // Make layer tabs draggable
        if (layerId) {
            button.draggable = true;
            button.dataset.layerId = layerId;
            button.addEventListener('dragstart', (e) => {
                e.dataTransfer!.setData('text/plain', layerId);
                button.classList.add('dragging');
            });
            button.addEventListener('dragend', () => {
                button.classList.remove('dragging');
            });
            button.addEventListener('dragover', (e) => {
                e.preventDefault();
                button.classList.add('drag-over');
            });
            button.addEventListener('dragleave', () => {
                button.classList.remove('drag-over');
            });
            button.addEventListener('drop', (e) => {
                e.preventDefault();
                button.classList.remove('drag-over');
                const draggedId = e.dataTransfer!.getData('text/plain');
                if (draggedId === layerId) return;
                // Insert after target if dropping on right half of button
                const rect = button.getBoundingClientRect();
                const afterTarget = e.clientX > rect.left + rect.width / 2;
                reorderLayerTabs(draggedId, layerId, afterTarget);
            });
        }
    };

    const reorderLayerTabs = (draggedId: string, targetId: string, afterTarget = false) => {
        const layerTabs = tabs.filter(t => t.layerId);
        const draggedIdx = layerTabs.findIndex(t => t.layerId === draggedId);
        let targetIdx = layerTabs.findIndex(t => t.layerId === targetId);
        if (draggedIdx === -1 || targetIdx === -1) return;

        // Reorder the layer tabs in the main tabs array
        const globalTabs = tabs.filter(t => !t.layerId);
        const moved = layerTabs.splice(draggedIdx, 1)[0];
        // Adjust target index after removal
        if (draggedIdx < targetIdx) targetIdx--;
        if (afterTarget) targetIdx++;
        layerTabs.splice(targetIdx, 0, moved);

        // Rebuild tabs array
        tabs.length = 0;
        tabs.push(...globalTabs, ...layerTabs);

        // Rebuild DOM order for buttons and panels
        tabs.forEach((t, i) => {
            tabBar.appendChild(t.button);
            tabPanels.appendChild(t.panel);
            // Re-bind click to new index
            t.button.onclick = () => activateTab(i);
        });

        // Update Dmd layer order
        dmd.moveLayer(draggedId, targetIdx);

        // Keep active tab visually active
        const activeIdx = tabs.findIndex(t => t.panel.classList.contains('active'));
        if (activeIdx >= 0) activateTab(activeIdx);
    };

    // Allow dropping on the tab bar itself (empty space after last tab = move to end)
    tabBar.addEventListener('dragover', (e) => { e.preventDefault(); });
    tabBar.addEventListener('drop', (e) => {
        if ((e.target as HTMLElement) !== tabBar) return;
        e.preventDefault();
        const draggedId = e.dataTransfer!.getData('text/plain');
        const layerTabs = tabs.filter(t => t.layerId);
        const lastLayerId = layerTabs[layerTabs.length - 1]?.layerId;
        if (!lastLayerId || draggedId === lastLayerId) return;
        reorderLayerTabs(draggedId, lastLayerId, true);
    });

    // Small DOM helpers
    const row = (panel: HTMLElement, ...nodes: (Node | string)[]) => {
        const r = document.createElement('div');
        r.className = 'ctl-row';
        nodes.forEach(n => r.append(n));
        panel.appendChild(r);
        return r;
    };
    const btn = (text: string, onClick: () => void) => {
        const b = document.createElement('button');
        b.textContent = text;
        b.addEventListener('click', onClick);
        return b;
    };
    const labelEl = (text: string) => {
        const l = document.createElement('label');
        l.textContent = text;
        return l;
    };
    const tag = (text: string) => {
        const s = document.createElement('span');
        s.className = 'ctl-tag';
        s.textContent = text;
        return s;
    };

    const easingOptions: { label: string; fn: EasingFunction }[] = [
        { label: 'Ease out sine', fn: Easing.easeOutSine },
        { label: 'Ease in sine',  fn: Easing.easeInSine },
        { label: 'Ease out quad', fn: Easing.easeOutQuad },
        { label: 'Linear',        fn: Easing.easeLinear },
    ];

    const easingSelect = () => {
        const select = document.createElement('select');
        select.style.background = '#222';
        select.style.color = '#fff';
        select.style.border = '1px solid #555';
        select.style.borderRadius = '4px';
        select.style.padding = '4px 6px';
        easingOptions.forEach((opt, i) => {
            const o = document.createElement('option');
            o.value = String(i);
            o.textContent = opt.label;
            select.appendChild(o);
        });
        const getEasing = () => easingOptions[parseInt(select.value)].fn;
        return { select, getEasing };
    };

    const durationSlider = (initial: number = 1000) => {
        const value = document.createElement('span');
        value.textContent = `${initial} ms`;
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '10000';
        slider.step = '100';
        slider.value = String(initial);
        slider.addEventListener('input', () => {
            value.textContent = `${slider.value} ms`;
        });
        const getDuration = () => parseInt(slider.value);
        return { slider, value, getDuration };
    };

    // Global (DMD) tab — brightness (H2) + fades (H1)
    addTab('Global (DMD)', (panel) => {
        const brightnessValue = document.createElement('span');
        const brightnessSlider = document.createElement('input');
        brightnessSlider.type = 'range';
        brightnessSlider.min = '0';
        brightnessSlider.max = '1';
        brightnessSlider.step = '0.01';

        const syncFadeDmdButtons = () => {
            dmdFadeOutBtn.disabled = dmd.brightness <= 0;
            dmdFadeInBtn.disabled = dmd.brightness >= 1;
        };

        const syncBrightness = () => {
            brightnessSlider.value = String(dmd.brightness);
            brightnessValue.textContent = dmd.brightness.toFixed(2);
            syncFadeDmdButtons();
        };
        brightnessSlider.addEventListener('input', () => {
            const b = parseFloat(brightnessSlider.value);
            dmd.setBrightness(b);
            brightnessValue.textContent = b.toFixed(2);
            syncFadeDmdButtons();
        });

        row(panel, labelEl('Brightness'), brightnessSlider, brightnessValue, tag('H2'));

        // Dot shape selector
        const shapeSelect = document.createElement('select');
        shapeSelect.style.background = '#222';
        shapeSelect.style.color = '#fff';
        shapeSelect.style.border = '1px solid #555';
        shapeSelect.style.borderRadius = '4px';
        shapeSelect.style.padding = '4px 6px';
        const shapes: { label: string; value: DotShape }[] = [
            { label: 'Square', value: DotShape.Square },
            { label: 'Circle', value: DotShape.Circle },
            { label: 'Diamond', value: DotShape.Diamond },
            { label: 'Rounded Square', value: DotShape.RoundedSquare },
            { label: 'Hexagon', value: DotShape.Hexagon },
            { label: 'Octagon', value: DotShape.Octagon },
            { label: 'Star', value: DotShape.Star },
        ];
        shapes.forEach((s) => {
            const o = document.createElement('option');
            o.value = String(s.value);
            o.textContent = s.label;
            if (s.value === dmd.dotShape) o.selected = true;
            shapeSelect.appendChild(o);
        });

        // Dot size slider
        const dotSizeValue = document.createElement('span');
        const dotSizeSlider = document.createElement('input');
        dotSizeSlider.type = 'range';
        dotSizeSlider.min = '1';
        dotSizeSlider.max = '20';
        dotSizeSlider.step = '1';
        dotSizeSlider.value = String(dmd.dotSize);
        dotSizeValue.textContent = String(dmd.dotSize);

        // Live DMD resolution display
        const dmdSizeDisplay = document.createElement('span');
        dmdSizeDisplay.style.color = '#6cf';
        const syncDmdSize = () => {
            dmdSizeDisplay.textContent = `${dmd.visibleDotsX} × ${dmd.visibleDotsY}`;
        };
        syncDmdSize();

        dotSizeSlider.addEventListener('input', () => {
            dmd.setDotSize(parseInt(dotSizeSlider.value));
            // Sync back in case clamped
            dotSizeSlider.value = String(dmd.dotSize);
            dotSizeValue.textContent = String(dmd.dotSize);
            syncDmdSize();
        });
        row(panel, labelEl('Dot Size'), dotSizeSlider, dotSizeValue);

        // Dot spacing slider
        const dotSpaceValue = document.createElement('span');
        const dotSpaceSlider = document.createElement('input');
        dotSpaceSlider.type = 'range';
        dotSpaceSlider.min = String(dmd.minDotSpace);
        dotSpaceSlider.max = '10';
        dotSpaceSlider.step = '1';
        dotSpaceSlider.value = String(dmd.dotSpace);
        dotSpaceValue.textContent = String(dmd.dotSpace);
        dotSpaceSlider.addEventListener('input', () => {
            dmd.setDotSpace(parseInt(dotSpaceSlider.value));
            dotSpaceValue.textContent = String(dmd.dotSpace);
            syncDmdSize();
        });
        row(panel, labelEl('Dot Space'), dotSpaceSlider, dotSpaceValue);

        row(panel, labelEl('DMD Size'), dmdSizeDisplay);

        shapeSelect.addEventListener('change', () => {
            dmd.setDotShape(parseInt(shapeSelect.value) as DotShape);
            // Sync dot size slider after shape change (min size may have been enforced)
            dotSizeSlider.value = String(dmd.dotSize);
            dotSizeValue.textContent = String(dmd.dotSize);
            // Sync dot space slider after shape change (min space may have been enforced)
            dotSpaceSlider.min = String(dmd.minDotSpace);
            dotSpaceSlider.value = String(dmd.dotSpace);
            dotSpaceValue.textContent = String(dmd.dotSpace);
            syncDmdSize();
        });
        row(panel, labelEl('Dot Shape'), shapeSelect);

        const dmdEasing = easingSelect();
        const dmdDuration = durationSlider(1000);
        const dmdFadeOutBtn = btn('Fade out', () => {
            dmdFadeOutBtn.disabled = true;
            dmdFadeInBtn.disabled = true;
            dmd.fadeOut(dmdDuration.getDuration()).then(syncBrightness);
        });
        const dmdFadeInBtn = btn('Fade in', () => {
            dmdFadeInBtn.disabled = true;
            dmdFadeOutBtn.disabled = true;
            dmd.fadeIn(dmdDuration.getDuration()).then(syncBrightness);
        });

        syncFadeDmdButtons();
        row(panel, dmdFadeOutBtn, dmdFadeInBtn, labelEl('Easing'), dmdEasing.select, tag('H1'));
        row(panel, labelEl('Duration'), dmdDuration.slider, dmdDuration.value);

        syncBrightness();
    });

    // One tab per layer — common controls (visibility, opacity) + specific ones
    layerDescriptors.forEach((desc) => {
        addTab(`${desc.label} [${desc.kind}]`, (panel) => {
            const layer = dmd.getLayer(desc.id);

            if (desc.note) {
                const note = document.createElement('div');
                note.className = 'ctl-note';
                note.textContent = desc.note;
                panel.appendChild(note);
            }

            if (!layer) {
                panel.appendChild(labelEl(`Layer "${desc.id}" not found`));
                return;
            }

            // Common — fade / opacity sync helpers (declared early so event handlers can reference them)
            const fadeInBtn = document.createElement('button');
            fadeInBtn.textContent = 'Fade in';
            const fadeOutBtn = document.createElement('button');
            fadeOutBtn.textContent = 'Fade out';
            const opacityValue = document.createElement('span');
            opacityValue.textContent = layer.opacity.toFixed(2);
            const opacitySlider = document.createElement('input');
            opacitySlider.type = 'range';
            opacitySlider.min = '0';
            opacitySlider.max = '1';
            opacitySlider.step = '0.01';
            opacitySlider.value = String(layer.opacity);

            const syncFadeButtons = () => {
                fadeInBtn.disabled = layer.opacity >= 1;
                fadeOutBtn.disabled = layer.opacity <= 0;
            };

            const syncOpacity = () => {
                opacitySlider.value = String(layer.opacity);
                opacityValue.textContent = layer.opacity.toFixed(2);
                visCheckbox.checked = layer.isVisible();
            };

            // Common — visibility
            const visCheckbox = document.createElement('input');
            visCheckbox.type = 'checkbox';
            visCheckbox.checked = layer.isVisible();
            visCheckbox.addEventListener('change', () => {
                layer.setVisibility(visCheckbox.checked);
                if (visCheckbox.checked && desc.kind === 'sprites' && desc.spriteId) {
                    (layer as SpritesLayer).run(desc.spriteId);
                }
                syncFadeButtons();
            });
            const visLabel = document.createElement('label');
            visLabel.append(visCheckbox, ' Visible');
            row(panel, visLabel);

            // Common — opacity
            opacitySlider.addEventListener('input', () => {
                const o = parseFloat(opacitySlider.value);
                layer.setOpacity(o);
                opacityValue.textContent = o.toFixed(2);
                syncFadeButtons();
            });
            row(panel, labelEl('Opacity'), opacitySlider, opacityValue);

            // Common — fade in / fade out
            const layerEasing = easingSelect();
            const layerDuration = durationSlider(1000);
            fadeInBtn.addEventListener('click', () => {
                if (!layer.isVisible()) {
                    layer.setOpacity(0);
                    layer.setVisibility(true);
                    visCheckbox.checked = true;
                }
                fadeInBtn.disabled = true;
                fadeOutBtn.disabled = true;
                layer.fadeIn(layerDuration.getDuration(), layerEasing.getEasing()).then(() => {
                    syncOpacity();
                    syncFadeButtons();
                });
            });
            fadeOutBtn.addEventListener('click', () => {
                fadeInBtn.disabled = true;
                fadeOutBtn.disabled = true;
                layer.fadeOut(layerDuration.getDuration(), layerEasing.getEasing()).then(() => {
                    layer.setVisibility(false);
                    syncOpacity();
                    syncFadeButtons();
                });
            });

            syncFadeButtons();
            row(panel, fadeInBtn, fadeOutBtn, labelEl('Easing'), layerEasing.select);
            row(panel, labelEl('Duration'), layerDuration.slider, layerDuration.value);

            // Specific controls
            if (desc.kind === 'animation') {
                const anim = layer as AnimationLayer;
                const frameInfo = document.createElement('span');
                frameInfo.className = 'ctl-note';
                const showFrame = () => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    frameInfo.textContent = `frame: ${(anim as any)._frameIndex}`;
                };
                showFrame();
                row(panel,
                    btn('Play', () => anim.play(true)),
                    btn('Pause', () => { anim.pause(); showFrame(); }),
                    btn('Stop', () => { anim.stop(); showFrame(); })
                );
                row(panel,
                    btn('\u25C0 Prev frame', () => { anim.previousFrame(); showFrame(); }),
                    btn('Next frame \u25B6', () => { anim.nextFrame(); showFrame(); }),
                    frameInfo,
                    tag('H3')
                );
            } else if (desc.kind === 'video') {
                const video = layer as VideoLayer;
                row(panel,
                    btn('Play', () => video.play()),
                    btn('Pause', () => video.pause()),
                    btn('Stop', () => video.stop())
                );
            } else if (desc.kind === 'sprites') {
                const sprites = layer as SpritesLayer;
                const sid = desc.spriteId ?? 'scott';
                row(panel,
                    btn('Run', () => sprites.run(sid)),
                    btn('Stop', () => sprites.stop(sid))
                );
            } else if (desc.kind === 'text') {
                const text = layer as TextLayer;
                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = 'New text\u2026';
                input.value = text.text;
                row(panel,
                    input,
                    btn('Set text', () => { if (input.value) text.setText(input.value); })
                );

                const colorInput = document.createElement('input');
                colorInput.type = 'color';
                colorInput.value = '#ffffff';
                colorInput.addEventListener('input', () => {
                    text.setTextColor(colorInput.value);
                });
                row(panel, labelEl('Color'), colorInput);

                const adjustCheckbox = document.createElement('input');
                adjustCheckbox.type = 'checkbox';
                adjustCheckbox.checked = text.adjustWidth;
                adjustCheckbox.addEventListener('change', () => {
                    text.setAdjustWidth(adjustCheckbox.checked);
                });
                const adjustLabel = document.createElement('label');
                adjustLabel.append(adjustCheckbox, ' Adjust width');
                row(panel, adjustLabel);
            } else if (desc.kind === 'canvas' && desc.id === 'bg') {
                const canvas = layer as CanvasLayer;

                const textArea = document.createElement('div');

                // Same appearance as the original layer content but built with canvas operations
                const editor =new EditorView({
                    doc: "function({fillColor, fillGradient, drawGradientRect, drawRect, drawLine, drawBitmap}) { //🔒\n" +
                    "  // const imagesPath = document.baseURI.replace('index.html', '') + 'images'; //🔒 \n" +
                    "  fillColor('#0C98F4'); //Fill the whole canvas\n" +
                    "  drawRect(0,17,426,96,'#FF0000'); //Draw a rectangle\n" +
                    "  // drawLine(0, 126, 426, 126, '#00FF00'); //Draw a line\n" +
                    "  // fillGradient(['#FF0000','#00FF00','#0000FF'], 'horizontal'); //Fill a gradient\n" +
                    "  // drawGradientRect(10, 10, 50, 20, ['#FF0000','#0000FF']); //Gradient rect\n" +
                    "  // fetch(`${imagesPath}/bg-2.png`)\n" +
                    "  //  .then(response => response.blob())\n" +
                    "  //  .then(blob => createImageBitmap(blob))\n" +
                    "  //  .then(bitmap => {\n" +
                    "  //    drawBitmap(bitmap); //Draw a bitmap\n" +
                    "  //  });\n" +
                    "} //🔒",
                    extensions: [
                        basicSetup,
                        javascript({ typescript: true }),
                        oneDark,
                         readOnlyRangesExtension(getReadOnlyRanges)
                    ],
                    parent: textArea
                })


                textArea.style.width = '100%';

                const applyDrawFunction = () => {
                    const code = getEditableContent(editor.state);
                    canvas.setDrawFunction(({fillColor, fillGradient, drawGradientRect, drawRect, drawLine, drawBitmap}) => {
                        try {
                            const fullCode = "const imagesPath = document.baseURI.replace('index.html', '') + 'images';\n" + code;
                            const fn = new Function('fillColor', 'fillGradient', 'drawGradientRect', 'drawRect', 'drawLine', 'drawBitmap', fullCode);
                            fn(fillColor, fillGradient, drawGradientRect, drawRect, drawLine, drawBitmap);
                        } catch (e) {
                            console.error('Draw function error:', e);
                        }
                    });
                    canvas.draw();
                };

                //applyDrawFunction();

                row(panel, textArea);
                row(panel,
                    btn('Draw', applyDrawFunction),
                    btn('Clear', () => canvas.clear())
                );
            }
        }, desc.id);
    });

    activateTab(0);
}
