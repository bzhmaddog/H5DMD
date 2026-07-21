import { CanvasLayer, Colors, Dmd, LayerGroup, TextLayer } from 'h5dmd'

/**
 * A static, no-controls showcase of how TextLayer places its text *inside its own layer box*
 * - which is a different thing from where the layer sits on the DMD (that's `position`, and
 * it's what the basic/advanced demos cover).
 *
 * The page is two LayerGroups side by side, so each half is one unit: its children are
 * positioned relative to the group, and moving/resizing a half is a single edit to the group
 * (nothing below re-derives an absolute DMD coordinate). Every text layer draws its border,
 * so you can see the box the text is being placed in.
 *
 *   - left group:  the 9 hAlign x vAlign combinations. Each cell's text is the name of its
 *                  own alignment, so the label is also the demonstration.
 *   - right group: manual positioning with explicit left/top, which overrides the alignment
 *                  on that axis (and only that axis), in pixels or as a percentage, plus the
 *                  hOffset/vOffset nudges that apply on top of either mode.
 */

// The DMD grid is 426x130 dots (1280x390 canvas at dotSize:2/dotSpace:1).
const DMD_WIDTH = 426
const DMD_HEIGHT = 130

// The manual column only needs to be as wide as its longest label; the alignment grid is the
// point of the page, so it gets everything left over. Move this one number to re-split the
// DMD - both groups and all their children follow.
const MANUAL_GROUP_WIDTH = 170

// --- Left group: the 3x3 alignment grid ---
const ALIGN_GROUP_WIDTH = DMD_WIDTH - MANUAL_GROUP_WIDTH
const GRID_LEFT = 6
const GRID_TOP = 14
const CELL_GAP = 3
// Three cells + two gaps fill the group between its left/right margins.
const CELL_WIDTH = Math.floor((ALIGN_GROUP_WIDTH - GRID_LEFT * 2 - CELL_GAP * 2) / 3)
const CELL_HEIGHT = 36
// Uniform across all nine cells, in px (see the addLayer call below): the widest label,
// 'center middle', measures ~72 of the 79 dots at this size.
const CELL_FONT_SIZE = 10
// Keeps flush-aligned text from being overdrawn by the cell border.
const CELL_PAD = 3

// --- Right group: the manual-positioning column ---
const MANUAL_MARGIN = 8
const MANUAL_TOP = 14
const MANUAL_WIDTH = MANUAL_GROUP_WIDTH - MANUAL_MARGIN * 2
const MANUAL_LEFT = MANUAL_MARGIN
const MANUAL_HEIGHT = 26
const MANUAL_GAP = 4
// In px, uniform across the four boxes: the longest label measures ~130 of the 154 dots.
const MANUAL_FONT_SIZE = 10

// The preferred spellings. 'left'/'right' and 'top'/'middle'/'bottom' still work as aliases,
// but a reference page should show the names the library leads with.
const H_ALIGNS = ['start', 'center', 'end'] as const
const V_ALIGNS = ['start', 'center', 'end'] as const

export function setupTextLayers(dmd: Dmd): void {
    // ---------------------------------------------------------------------
    // Left: every hAlign/vAlign pair. No left/top is given, so alignment alone places the
    // text - and each cell's text names the corner it lands in.
    // ---------------------------------------------------------------------
    const alignments = dmd.addLayerGroup('alignments', {
        width: ALIGN_GROUP_WIDTH,
        height: DMD_HEIGHT,
        position: { top: 0, left: 0 },
    })

    heading(alignments, 'align-heading', GRID_LEFT, ALIGN_GROUP_WIDTH - GRID_LEFT * 2, 'hAlign x vAlign', Colors.Blue)

    V_ALIGNS.forEach((vAlign, row) => {
        H_ALIGNS.forEach((hAlign, col) => {
            alignments.addLayer(TextLayer, `align-${hAlign}-${vAlign}`, {
                width: CELL_WIDTH,
                height: CELL_HEIGHT,
                position: {
                    left: GRID_LEFT + col * (CELL_WIDTH + CELL_GAP),
                    top: GRID_TOP + row * (CELL_HEIGHT + CELL_GAP),
                },
                // Both axes use the same three names now, so the label says which is which.
                text: `${hAlign} / ${vAlign}`,
                hAlign,
                vAlign,
                // Alignment puts the ink flush against the layer edge, and the border is drawn
                // on top of the content - so a start/end-aligned glyph loses its outermost dots
                // under it. Inset the text with the offsets, which is exactly what they're for:
                // they apply on top of whatever the alignment decided.
                hOffset: hAlign === 'start' ? CELL_PAD : hAlign === 'end' ? -CELL_PAD : 0,
                vOffset: vAlign === 'start' ? CELL_PAD : vAlign === 'end' ? -CELL_PAD : 0,
                // Sized in px, not %, so every cell gets the same glyphs. A % fontSize is
                // resolved against *this string's* measured ink height, so labels with a
                // descender ('left top') would come out smaller than labels without one
                // ('center middle') - correct by that option's definition, but it would make
                // this grid look broken.
                fontSize: CELL_FONT_SIZE,
                fontUnit: 'px',
                // No adjustWidth either: it shrinks only the labels that don't fit, which
                // would be a second source of mixed sizes.
                adjustWidth: false,
                color: Colors.White,
                borderWidth: 1,
                borderColor: Colors.Blue,
            })
        })
    })

    // ---------------------------------------------------------------------
    // Right: manual positioning. An explicit left/top is used verbatim and overrides the
    // alignment on its own axis; the axis you leave unset is still placed by hAlign/vAlign
    // (whose defaults are 'center'/'middle'), so the two can be mixed freely.
    // ---------------------------------------------------------------------
    const manual = dmd.addLayerGroup('manual', {
        width: MANUAL_GROUP_WIDTH,
        height: DMD_HEIGHT,
        position: { top: 0, left: ALIGN_GROUP_WIDTH },
    })

    // Rule between the two halves, at the manual group's own left edge.
    manual.addLayer(
        CanvasLayer,
        'divider',
        {
            width: 1,
            height: DMD_HEIGHT,
            position: { left: 0, top: 0 },
        },
        layer => layer.fillColor(Colors.DarkOrange),
    )

    heading(manual, 'manual-heading', MANUAL_LEFT, MANUAL_WIDTH, 'manual left / top', Colors.Orange)

    const cases: Array<{ id: string; text: string; options: Record<string, unknown> }> = [
        {
            // Both axes explicit: the 'center' alignment defaults are overridden, and the text
            // is drawn at exactly (4, 2) in the layer.
            id: 'manual-pixels',
            text: 'left 4 / top 2',
            options: { left: 4, top: 2 },
        },
        {
            // Percentages resolve against the *layer's* width/height (not the DMD's), so this
            // one starts a quarter of the way across its own box.
            id: 'manual-percent',
            text: "left '25%' / top '50%'",
            options: { left: '25%', top: '50%' },
        },
        {
            // One axis each way: hAlign still centers horizontally because no `left` was given,
            // while the explicit `top` overrides vAlign's 'center' default.
            id: 'manual-mixed',
            text: 'hAlign center + top 3',
            options: { hAlign: 'center', top: 3 },
        },
        {
            // Offsets are added *after* whichever mode placed the text, so they nudge an
            // aligned position just as well as an explicit one. The vOffset also lifts the
            // end-aligned ink clear of the border drawn over it.
            id: 'manual-offsets',
            text: 'vAlign end + offsets',
            options: { hAlign: 'start', vAlign: 'end', hOffset: 12, vOffset: -3 },
        },
    ]

    cases.forEach((entry, i) => {
        manual.addLayer(TextLayer, entry.id, {
            width: MANUAL_WIDTH,
            height: MANUAL_HEIGHT,
            position: {
                left: MANUAL_LEFT,
                top: MANUAL_TOP + i * (MANUAL_HEIGHT + MANUAL_GAP),
            },
            text: entry.text,
            // Uniform size here too, and in px for the same reason as the grid: a % fontSize
            // would size each label against its own ink height, so these four would not match.
            adjustWidth: false,
            fontSize: MANUAL_FONT_SIZE,
            fontUnit: 'px',
            color: Colors.Yellow,
            borderWidth: 1,
            borderColor: Colors.Orange,
            ...entry.options,
        })
    })
}

/** Section title at the top of one of the two groups. */
function heading(group: LayerGroup, id: string, left: number, width: number, text: string, color: string): void {
    group.addLayer(TextLayer, id, {
        width,
        height: 10,
        position: { left, top: 2 },
        text,
        hAlign: 'start',
        vAlign: 'center',
        // px, so both headings match each other (see the cell comment about % sizing).
        fontSize: 9,
        fontUnit: 'px',
        color,
    })
}
