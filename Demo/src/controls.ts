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
    {id: 'text4', label: 'Text: Matthew', kind: 'text'},
    {id: 'svg-title', label: 'SVG Title', kind: 'canvas'},
    {id: 'big-text-demo', label: 'Text Demo', kind: 'text'},
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

        // Off-dot color picker
        const offDotPicker = document.createElement('input');
        offDotPicker.type = 'color';
        offDotPicker.style.cssText = 'cursor:pointer;border:1px solid #555;border-radius:4px;height:26px;padding:1px 2px;background:#222;';
        const { r: or, g: og, b: ob } = dmd.offDotColor;
        const toHex2 = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
        offDotPicker.value = `#${toHex2(or)}${toHex2(og)}${toHex2(ob)}`;
        offDotPicker.addEventListener('input', () => {
            const hex = offDotPicker.value;
            dmd.setOffDotColor(
                parseInt(hex.slice(1, 3), 16) / 255,
                parseInt(hex.slice(3, 5), 16) / 255,
                parseInt(hex.slice(5, 7), 16) / 255
            );
            syncHsvSliders(); // redraw swatch with updated off-dot color
        });
        row(panel, labelEl('Off-dot color'), offDotPicker);

        // FPS overlay toggle
        const fpsCheckbox = document.createElement('input');
        fpsCheckbox.type = 'checkbox';
        fpsCheckbox.checked = dmd.showFPS;
        fpsCheckbox.addEventListener('change', () => { dmd.showFPS = fpsCheckbox.checked; });
        row(panel, labelEl('Show FPS'), fpsCheckbox);

        row(panel, labelEl('Brightness'), brightnessSlider, brightnessValue);

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
            drawShapePreview(dmd.dotShape);
            // Reset dot size to the minimum for the new shape
            dmd.setDotSize(1);
            dotSizeSlider.min = String(dmd.dotSize);
            dotSizeSlider.value = String(dmd.dotSize);
            dotSizeValue.textContent = String(dmd.dotSize);
            // Sync dot space slider after shape change (min space may have been enforced)
            dotSpaceSlider.min = String(dmd.minDotSpace);
            dotSpaceSlider.value = String(dmd.dotSpace);
            dotSpaceValue.textContent = String(dmd.dotSpace);
            syncDmdSize();
        });

        // Dot shape preview canvas
        const shapeCanvas = document.createElement('canvas');
        shapeCanvas.width = 36;
        shapeCanvas.height = 36;
        shapeCanvas.style.cssText = 'border:1px solid #555;border-radius:3px;vertical-align:middle;background:#111;';
        const shapeCtx = shapeCanvas.getContext('2d')!;
        const drawShapePreview = (shape: DotShape) => {
            const size = shapeCanvas.width;
            const cx = size / 2, cy = size / 2, r = size * 0.38;
            shapeCtx.clearRect(0, 0, size, size);
            shapeCtx.fillStyle = '#ffcc00';
            shapeCtx.beginPath();
            switch (shape) {
                case DotShape.Square:
                    shapeCtx.fillRect(cx - r, cy - r, r * 2, r * 2);
                    return;
                case DotShape.Circle:
                    shapeCtx.arc(cx, cy, r, 0, Math.PI * 2);
                    break;
                case DotShape.Diamond:
                    shapeCtx.moveTo(cx, cy - r);
                    shapeCtx.lineTo(cx + r, cy);
                    shapeCtx.lineTo(cx, cy + r);
                    shapeCtx.lineTo(cx - r, cy);
                    shapeCtx.closePath();
                    break;
                case DotShape.RoundedSquare:
                    shapeCtx.roundRect(cx - r, cy - r, r * 2, r * 2, r * 0.3);
                    break;
                case DotShape.Hexagon:
                    for (let i = 0; i < 6; i++) {
                        const a = (Math.PI / 3) * i - Math.PI / 6;
                        if (i === 0) shapeCtx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
                        else         shapeCtx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
                    }
                    shapeCtx.closePath();
                    break;
                case DotShape.Octagon:
                    for (let i = 0; i < 8; i++) {
                        const a = (Math.PI / 4) * i - Math.PI / 8;
                        if (i === 0) shapeCtx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
                        else         shapeCtx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
                    }
                    shapeCtx.closePath();
                    break;
                case DotShape.Star: {
                    // Matches shader: union of diamond (d1 <= 0.333) and square (d2 <= 0.25)
                    // produces a 4-pointed cross-star with pointed tips along the axes.
                    const outerR = r * (0.333 / 0.5); // tip distance
                    const innerR = r * (0.25 / 0.5);  // square half-size
                    const transR = outerR - innerR;    // gap between square edge and tip
                    const pts: [number, number][] = [
                        [ outerR,      0],
                        [ innerR,  transR], [ innerR,  innerR], [ transR,  innerR],
                        [      0,  outerR],
                        [-transR,  innerR], [-innerR,  innerR], [-innerR,  transR],
                        [-outerR,      0],
                        [-innerR, -transR], [-innerR, -innerR], [-transR, -innerR],
                        [      0, -outerR],
                        [ transR, -innerR], [ innerR, -innerR], [ innerR, -transR],
                    ];
                    shapeCtx.moveTo(cx + pts[0][0], cy + pts[0][1]);
                    for (let i = 1; i < pts.length; i++) shapeCtx.lineTo(cx + pts[i][0], cy + pts[i][1]);
                    shapeCtx.closePath();
                    break;
                }
            }
            shapeCtx.fill();
        };
        drawShapePreview(dmd.dotShape);
        row(panel, labelEl('Dot Shape'), shapeSelect, shapeCanvas);

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
        row(panel, dmdFadeOutBtn, dmdFadeInBtn, labelEl('Easing'), dmdEasing.select);
        row(panel, labelEl('Duration'), dmdDuration.slider, dmdDuration.value);

        // Monochrome mode + color picker
        // HSV ↔ RGB helpers
        const hsvToRgb = (h: number, s: number, v: number) => {
            const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
            let r = 0, g = 0, b = 0;
            if      (h < 60)  { r = c; g = x; b = 0; }
            else if (h < 120) { r = x; g = c; b = 0; }
            else if (h < 180) { r = 0; g = c; b = x; }
            else if (h < 240) { r = 0; g = x; b = c; }
            else if (h < 300) { r = x; g = 0; b = c; }
            else              { r = c; g = 0; b = x; }
            return { r: r + m, g: g + m, b: b + m };
        };
        const rgbToHsv = (r: number, g: number, b: number) => {
            const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
            const v = max, s = max === 0 ? 0 : d / max;
            let h = 0;
            if (d !== 0) {
                if      (max === r) h = 60 * (((g - b) / d) % 6);
                else if (max === g) h = 60 * ((b - r) / d + 2);
                else               h = 60 * ((r - g) / d + 4);
            }
            return { h: (h + 360) % 360, s, v };
        };
        const hspOf = (r: number, g: number, b: number) =>
            Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);
        // Minimum V (0–1) for given H/S — uses 4× bgHSP so on-dots have
        // meaningful contrast over off-dots (the library guard uses 1× as hard floor)
        const minV = (h: number, s: number) => {
            const { r, g, b } = hsvToRgb(h, s, 1);
            const hspAtV1 = hspOf(r, g, b);
            if (hspAtV1 === 0) return 1;
            return Math.min(1, (dmd.bgHSP * 4 / 255) / hspAtV1);
        };

        const monoCheckbox = document.createElement('input');
        monoCheckbox.type = 'checkbox';
        monoCheckbox.id = 'mono-checkbox';
        monoCheckbox.checked = dmd.monochrome;
        const monoLabel = document.createElement('label');
        monoLabel.htmlFor = 'mono-checkbox';
        monoLabel.textContent = 'Monochrome';

        // Initialise HSV from current monochrome color
        const { r: cr, g: cg, b: cb } = dmd.monochromeColor;
        let { h: curH, s: curS } = rgbToHsv(cr, cg, cb);
        const { v: curV } = rgbToHsv(cr, cg, cb);

        const makeSlider = (min: number, max: number, value: number, step = 1) => {
            const el = document.createElement('input');
            el.type = 'range'; el.min = String(min); el.max = String(max);
            el.step = String(step); el.value = String(value);
            el.style.width = '90px';
            return el;
        };

        const hSlider = makeSlider(0, 360, Math.round(curH));
        const sSlider = makeSlider(0, 100, Math.round(curS * 100));
        const vSlider = makeSlider(0, 100, Math.round(curV * 100), 1);
        const colorSwatch = document.createElement('canvas');
        colorSwatch.width = 160;
        colorSwatch.height = 22;
        colorSwatch.style.borderRadius = '3px';
        colorSwatch.style.border = '1px solid #555';
        colorSwatch.style.verticalAlign = 'middle';
        const swatchCtx = colorSwatch.getContext('2d')!;

        const syncHsvSliders = () => {
            const h = curH, s = curS;
            const floor = Math.ceil(minV(h, s) * 100);
            vSlider.min = String(floor);
            if (parseFloat(vSlider.value) < floor) vSlider.value = String(floor);
            const v = parseFloat(vSlider.value) / 100;
            const { r, g, b } = hsvToRgb(h, s, v);
            // Draw monoLevels brightness bands: level 0 = off-dot, levels 1..n-1 = tint scaled by level/(n-1)
            const n = dmd.monoLevels;
            const od = dmd.offDotColor;
            const bw = colorSwatch.width / n;
            for (let level = 0; level < n; level++) {
                if (level === 0) {
                    swatchCtx.fillStyle = `rgb(${Math.round(od.r*255)},${Math.round(od.g*255)},${Math.round(od.b*255)})`;
                } else {
                    const scale = level / (n - 1);
                    swatchCtx.fillStyle = `rgb(${Math.round(r * scale * 255)},${Math.round(g * scale * 255)},${Math.round(b * scale * 255)})`;
                }
                swatchCtx.fillRect(level * bw, 0, bw, colorSwatch.height);
            }
            if (dmd.monochrome) dmd.setMonochromeColor(r, g, b);
        };
        syncHsvSliders();

        // Levels select — must be declared before setDisabled which references it
        const levelsSelect = document.createElement('select');
        levelsSelect.style.cssText = 'background:#222;color:#fff;border:1px solid #555;border-radius:4px;padding:3px 5px;';
        [4, 8, 16].forEach(n => {
            const o = document.createElement('option');
            o.value = String(n); o.textContent = `${n} levels`;
            if (n === dmd.monoLevels) o.selected = true;
            levelsSelect.appendChild(o);
        });
        levelsSelect.addEventListener('change', () => {
            dmd.setMonoLevels(parseInt(levelsSelect.value));
            syncHsvSliders();
        });

        monoCheckbox.addEventListener('change', () => {
            dmd.setMonochrome(monoCheckbox.checked);
            const hidden = !monoCheckbox.checked;
            hsvRow.style.display = hidden ? 'none' : '';
            levelsRow.style.display = hidden ? 'none' : '';
        });
        hSlider.addEventListener('input', () => { curH = parseFloat(hSlider.value); syncHsvSliders(); });
        sSlider.addEventListener('input', () => { curS = parseFloat(sSlider.value) / 100; syncHsvSliders(); });
        vSlider.addEventListener('input', () => syncHsvSliders());

        row(panel, monoCheckbox, monoLabel);
        const hsvRow = row(panel, labelEl('H'), hSlider, labelEl('S'), sSlider, labelEl('V'), vSlider);
        const levelsRow = row(panel, labelEl('Levels'), levelsSelect, colorSwatch);
        hsvRow.style.display = dmd.monochrome ? '' : 'none';
        levelsRow.style.display = dmd.monochrome ? '' : 'none';

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
                    frameInfo
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

                const outlineValue = document.createElement('span');
                const outlineSlider = document.createElement('input');
                outlineSlider.type = 'range';
                outlineSlider.min = '0';
                outlineSlider.max = '10';
                outlineSlider.step = '1';
                outlineSlider.value = String(text.outlineWidth);
                outlineValue.textContent = outlineSlider.value;
                outlineSlider.addEventListener('input', () => {
                    outlineValue.textContent = outlineSlider.value;
                    text.setOutlineWidth(parseInt(outlineSlider.value));
                });
                row(panel, labelEl('Outline width'), outlineSlider, outlineValue);

                const outlineColorInput = document.createElement('input');
                outlineColorInput.type = 'color';
                // Initialise from the layer's current outlineColor (strip alpha if present)
                outlineColorInput.value = (text.outlineColor.startsWith('#') ? text.outlineColor : '#' + text.outlineColor).slice(0, 7);
                outlineColorInput.addEventListener('input', () => {
                    text.setOutlineColor(outlineColorInput.value);
                });
                row(panel, labelEl('Outline color'), outlineColorInput);

                const fontSizeValue = document.createElement('span');
                const fontSizeSlider = document.createElement('input');
                fontSizeSlider.type = 'range';
                fontSizeSlider.min = '0';
                fontSizeSlider.max = '100';
                fontSizeSlider.step = '1';
                fontSizeSlider.value = String(text.fontSize);
                fontSizeValue.textContent = `${fontSizeSlider.value}%`;
                fontSizeSlider.addEventListener('input', () => {
                    fontSizeValue.textContent = `${fontSizeSlider.value}%`;
                    text.setFontSize(parseInt(fontSizeSlider.value));
                });
                row(panel, labelEl('Font size'), fontSizeSlider, fontSizeValue);

                const fonts = ['Arial', 'Arial Black', 'Verdana', 'Helvetica', 'Tahoma',
                    'Trebuchet MS', 'Impact', 'Georgia', 'Times New Roman',
                    'Courier New', 'Lucida Console', 'monospace', 'serif', 'sans-serif',
                ];
                const fontSelect = document.createElement('select');
                fontSelect.style.cssText = 'background:#222;color:#fff;border:1px solid #555;border-radius:4px;padding:4px 6px;';
                fonts.forEach(f => {
                    const o = document.createElement('option');
                    o.value = f;
                    o.textContent = f;
                    o.style.fontFamily = f;
                    if (f === text.fontFamily) o.selected = true;
                    fontSelect.appendChild(o);
                });
                fontSelect.addEventListener('change', () => text.setFontFamily(fontSelect.value));
                row(panel, labelEl('Font'), fontSelect);

                // Extra decoration controls — only shown for the interactive text demo
                if (desc.id === 'big-text-demo') {
                    const bgPicker = document.createElement('input');
                    bgPicker.type = 'color';
                    bgPicker.style.cssText = 'cursor:pointer;border:1px solid #555;border-radius:4px;height:26px;padding:1px 2px;background:#222;';
                    bgPicker.value = text.backgroundColor?.slice(0, 7) ?? '#000000';
                    const bgEnabled = document.createElement('input');
                    bgEnabled.type = 'checkbox';
                    bgEnabled.checked = !!text.backgroundColor;
                    bgEnabled.addEventListener('change', () => {
                        text.setBackgroundColor(bgEnabled.checked ? bgPicker.value : undefined);
                    });
                    bgPicker.addEventListener('input', () => {
                        if (bgEnabled.checked) text.setBackgroundColor(bgPicker.value);
                    });
                    const bgLabel = document.createElement('label');
                    bgLabel.append(bgEnabled, '\u00a0Enable');
                    row(panel, labelEl('Background'), bgLabel, bgPicker);

                    const bgOpacityValue = document.createElement('span');
                    const bgOpacitySlider = document.createElement('input');
                    bgOpacitySlider.type = 'range';
                    bgOpacitySlider.min = '0';
                    bgOpacitySlider.max = '1';
                    bgOpacitySlider.step = '0.05';
                    bgOpacitySlider.value = String(text.backgroundOpacity);
                    bgOpacityValue.textContent = bgOpacitySlider.value;
                    bgOpacitySlider.addEventListener('input', () => {
                        bgOpacityValue.textContent = parseFloat(bgOpacitySlider.value).toFixed(2);
                        text.setBackgroundOpacity(parseFloat(bgOpacitySlider.value));
                    });
                    row(panel, labelEl('Bg opacity'), bgOpacitySlider, bgOpacityValue);

                    const borderColorPicker = document.createElement('input');
                    borderColorPicker.type = 'color';
                    borderColorPicker.style.cssText = 'cursor:pointer;border:1px solid #555;border-radius:4px;height:26px;padding:1px 2px;background:#222;';
                    borderColorPicker.value = text.borderColor?.slice(0, 7) ?? '#ffffff';
                    borderColorPicker.addEventListener('input', () => {
                        if (borderWidthSlider.valueAsNumber > 0) text.setBorderColor(borderColorPicker.value);
                    });
                    row(panel, labelEl('Border color'), borderColorPicker);

                    const borderWidthValue = document.createElement('span');
                    const borderWidthSlider = document.createElement('input');
                    borderWidthSlider.type = 'range';
                    borderWidthSlider.min = '0';
                    borderWidthSlider.max = '10';
                    borderWidthSlider.step = '1';
                    borderWidthSlider.value = String(text.borderWidth);
                    borderWidthValue.textContent = `${borderWidthSlider.value}px`;
                    borderWidthSlider.addEventListener('input', () => {
                        borderWidthValue.textContent = `${borderWidthSlider.value}px`;
                        text.setBorderWidth(borderWidthSlider.valueAsNumber);
                        if (borderWidthSlider.valueAsNumber > 0) text.setBorderColor(borderColorPicker.value);
                    });
                    row(panel, labelEl('Border width'), borderWidthSlider, borderWidthValue);
                }
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
