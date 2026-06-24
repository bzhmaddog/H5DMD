import {
    Dmd,
    AnimationLayer,
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
    {id: 'video', label: 'Video', kind: 'video'},
    {id: 'matthew', label: 'Matthew img', kind: 'canvas'},
    {id: 'sprite', label: 'Sprite', kind: 'sprites', spriteId: 'scott'},
    {id: 'text1', label: 'Text: Scott', kind: 'text'},
    {id: 'text2', label: 'Text: VS in', kind: 'text'},
    {id: 'text3', label: 'Text: VS out', kind: 'text'},
    {id: 'text4', label: 'Text: Matthew', kind: 'text'}
];

/**
 * Build the tabbed per-layer control panel for the given Dmd instance.
 * Layers must already be added to the Dmd before calling this.
 */
export function buildControlPanel(dmd: Dmd): void {

    const tabBar = document.getElementById('tab-bar') as HTMLDivElement;
    const tabPanels = document.getElementById('tab-panels') as HTMLDivElement;
    const tabs: { button: HTMLButtonElement; panel: HTMLDivElement }[] = [];

    const activateTab = (index: number) => {
        tabs.forEach((t, i) => {
            t.button.classList.toggle('active', i === index);
            t.panel.classList.toggle('active', i === index);
        });
    };

    const addTab = (label: string, build: (panel: HTMLDivElement) => void) => {
        const button = document.createElement('button');
        button.textContent = label;
        const panel = document.createElement('div');
        panel.className = 'tab-panel';
        build(panel);
        const index = tabs.length;
        button.addEventListener('click', () => activateTab(index));
        tabBar.appendChild(button);
        tabPanels.appendChild(panel);
        tabs.push({button, panel});
    };

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

    // Global (DMD) tab — brightness (H2) + fades (H1)
    addTab('Global (DMD)', (panel) => {
        const brightnessValue = document.createElement('span');
        const brightnessSlider = document.createElement('input');
        brightnessSlider.type = 'range';
        brightnessSlider.min = '0';
        brightnessSlider.max = '1';
        brightnessSlider.step = '0.01';

        const syncBrightness = () => {
            brightnessSlider.value = String(dmd.brightness);
            brightnessValue.textContent = dmd.brightness.toFixed(2);
        };
        brightnessSlider.addEventListener('input', () => {
            const b = parseFloat(brightnessSlider.value);
            dmd.setBrightness(b);
            brightnessValue.textContent = b.toFixed(2);
        });

        row(panel, labelEl('Brightness'), brightnessSlider, brightnessValue, tag('H2'));
        row(panel,
            btn('Fade out', () => dmd.fadeOut(1000).then(syncBrightness)),
            btn('Fade in', () => dmd.fadeIn(1000).then(syncBrightness)),
            tag('H1')
        );

        syncBrightness();
    });

    // One tab per layer — common controls (visibility, opacity) + specific ones
    layerDescriptors.forEach((desc) => {
        addTab(desc.label, (panel) => {
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

            // Common — visibility
            const visCheckbox = document.createElement('input');
            visCheckbox.type = 'checkbox';
            visCheckbox.checked = layer.isVisible();
            visCheckbox.addEventListener('change', () => {
                layer.setVisibility(visCheckbox.checked);
                if (visCheckbox.checked && desc.kind === 'sprites' && desc.spriteId) {
                    (layer as SpritesLayer).run(desc.spriteId);
                }
            });
            const visLabel = document.createElement('label');
            visLabel.append(visCheckbox, ' Visible');
            row(panel, visLabel);

            // Common — opacity
            const opacityValue = document.createElement('span');
            opacityValue.textContent = layer.opacity.toFixed(2);
            const opacitySlider = document.createElement('input');
            opacitySlider.type = 'range';
            opacitySlider.min = '0';
            opacitySlider.max = '1';
            opacitySlider.step = '0.01';
            opacitySlider.value = String(layer.opacity);
            opacitySlider.addEventListener('input', () => {
                const o = parseFloat(opacitySlider.value);
                layer.setOpacity(o);
                opacityValue.textContent = o.toFixed(2);
            });
            row(panel, labelEl('Opacity'), opacitySlider, opacityValue);

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
            }
        });
    });

    activateTab(0);
}
