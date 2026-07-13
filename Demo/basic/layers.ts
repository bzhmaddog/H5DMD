import {
    CanvasLayer,
    ChromaKeyRenderer,
    Colors,
    Dmd,
    LayerPosition,
    rendererEntry,
    ShakyRenderer,
    TextLayer,
    VideoLayer,
} from "h5dmd";

/**
 * Build four independent top-level LayerGroups tiling the DMD into quadrants, each
 * showcasing a different facet of the feature: a video panel (visibility cascade pausing a
 * child's playback), a HUD (background/opacity, a group-level renderer, one level of
 * nesting), a sandbox (the addLayer/removeLayer/moveLayer children API driven live from the
 * control panel), and a spare info panel.
 */

// The DMD grid is 426x130 dots (1280x390 canvas at dotSize:2/dotSpace:1) - each quadrant
// below is exactly a quarter of that: 213x65.
const QUADRANT_WIDTH = 213;
const QUADRANT_HEIGHT = 65;

export function setupBasicLayers(dmd: Dmd, imagesPath: string): void {

    // Register the custom HUD font. Registering alone is enough (no await needed):
    // TextLayer waits for a registered-but-unloaded font itself (document.fonts.load)
    // before measuring/drawing. Without this the family is unknown to the browser and
    // the label silently renders with the fallback font.
    const fontsPath = imagesPath.replace(/images$/, 'fonts');
    document.fonts.add(new FontFace('Dusty', `url(${fontsPath}/Dusty.otf)`));


    const catImageUrl: string = `${imagesPath}/cat.png`

    // ---------------------------------------------------------------------
    // Video panel (top-left, red) - hiding the group pauses the child video's playback
    // ---------------------------------------------------------------------
    const videoPanel = dmd.addLayerGroup('video-panel', {
        width: QUADRANT_WIDTH,
        height: QUADRANT_HEIGHT,
        position: {top: 0, left: 0},
        backgroundColor: Colors.Red,
        backgroundOpacity: 0.3,
    });

    videoPanel.addLayer(VideoLayer, 'clip', {
        width: QUADRANT_WIDTH,
        height: QUADRANT_HEIGHT,
        // Autoplay is off on purpose: browsers reject video.play() without a prior user
        // gesture, which autoplay:true would trigger immediately on load. Use the "Play"
        // button in the control panel instead.
        autoplay: false,
        loop: true,
        renderers: [
            rendererEntry('chroma-key', ChromaKeyRenderer, {color: [0, 0, 0], threshold: 9})
        ],
    }, (layer) => {
        const video = document.createElement('video');
        video.addEventListener('loadeddata', () => layer.setVideo(video));
        video.src = `${imagesPath}/sample.webm`;
    });

    videoPanel.addLayer(TextLayer, 'caption', {
        width: 120,
        height: 12,
        position: {top: 2, left: 4},
        text: 'video panel',
        fontSize: 80,
        color: Colors.White,
        backgroundColor: Colors.Black,
        backgroundOpacity: 0.5,
    });

    // ---------------------------------------------------------------------
    // HUD (top-right, green) — background/opacity, a group-level renderer, and a
    // nested subgroup
    // ---------------------------------------------------------------------
    const hud = dmd.addLayerGroup('hud', {
        width: QUADRANT_WIDTH,
        height: QUADRANT_HEIGHT,
        position: {top: 0, left: QUADRANT_WIDTH},
        backgroundColor: Colors.Green,
        backgroundOpacity: 0.3,
        // Registered inactive - the control panel toggles it with activateRenderer/
        // deactivateRenderer. Because it's a *group* renderer it runs once against the
        // already-composited label + badge image, so both shake together as one unit.
        renderers: [
            rendererEntry('shake', ShakyRenderer, {intensity: 1.5, speed: 12, mode: 'random'}, false)
        ],
    });

    hud.addLayer(TextLayer, 'label', {
        text: 'DMD',
        fontSize: 90,
        fontFamily: 'Dusty',
        hOffset: 5,
        vAlign: 'center',
        color: Colors.White,
        outlineWidth: 2,
        outlineColor: Colors.Yellow,
    });

    // Nested LayerGroup - the 3-level case (Dmd -> hud -> badge -> leaf layers).
    const badge = hud.addLayerGroup('badge', {
        width: 60,
        height: 22,
        position: {top: 15, left: 4},
        // Hidden by default so toggling the HUD's own visibility demonstrates restoring
        // each child's *own* prior state rather than forcing everything visible.
        visible: false,
    });

    badge.addLayer(CanvasLayer, 'icon', {
        width: 10,
        height: 10,
        position: {top: 2, left: 2},
    }, (layer) => {
        layer.fillColor(Colors.Orange);
    });

    badge.addLayer(TextLayer, 'count', {
        width: 40,
        height: 10,
        position: {top: 2, left: 16},
        text: '0',
        fontSize: 90,
        color: Colors.White,
    });

    // ---------------------------------------------------------------------
    // Sandbox (bottom-left, yellow) - seeded with a row of boxes; the control panel
    // drives addLayer/removeLayer/moveLayer on it live.
    // ---------------------------------------------------------------------
    const sandbox = dmd.addLayerGroup('sandbox', {
        width: QUADRANT_WIDTH,
        height: QUADRANT_HEIGHT,
        position: {top: QUADRANT_HEIGHT, left: 0},
        backgroundColor: Colors.Yellow,
        backgroundOpacity: 0.3,
    });

    const sandboxSeedColors = [Colors.Red, Colors.Blue, Colors.Green, Colors.Orange, Colors.White, Colors.DarkOrange];
    const sandboxBoxSize = 16;
    const sandboxSpacing = 4;
    sandboxSeedColors.forEach((color, i) => {
        sandbox.addLayer(CanvasLayer, `box-${i + 1}`, {
            width: sandboxBoxSize,
            height: sandboxBoxSize,
            position: {top: 24, left: 8 + i * (sandboxBoxSize + sandboxSpacing)},
        }, (layer) => layer.fillColor(color));
    });

    // ---------------------------------------------------------------------
    // Info (bottom-right, blue) - a minimal group: just dimensioned/positioned with a
    // background, no interactive controls needed to make the point.
    // ---------------------------------------------------------------------
    const info = dmd.addLayerGroup('info', {
        width: QUADRANT_WIDTH,
        height: QUADRANT_HEIGHT,
        position: {top: QUADRANT_HEIGHT, left: QUADRANT_WIDTH},
        backgroundColor: Colors.Blue,
        //backgroundOpacity: 0.3,
    });

    info.addLayer(
        CanvasLayer,
        'cat',
        {
            width: 60,
            height: 78,
            // Centered in the group by constraining both of the layer's centers to the
            // group's own centers ('parent' = the containing LayerGroup).
            position: {
                hAlign: 'constraint',
                hCenterToCenterOf: 'parent',
                vAlign: 'constraint',
                vCenterToCenterOf: 'parent',
            },
            //backgroundColor: Colors.White,
        },
        async (layer) => {
            const bitmap = await fetch(catImageUrl).then(r => r.blob()).then(createImageBitmap);
            layer.drawBitmap(bitmap, {hAlign: 'center', vAlign: 'center'});
        }
    );

    // ---------------------------------------------------------------------
    // Constraint marker - a small top-level layer the "Constraints" control panel
    // section repositions live against 'parent' or any of the four groups above.
    // Starts centered with no constraint (the selects' default).
    // ---------------------------------------------------------------------
    addConstraintMarker(dmd, {
        hAlign: 'center',
        vAlign: 'center',
    });
}

export const CONSTRAINT_MARKER_ID = 'constraint-marker';

/**
 * (Re)create the marker layer driven by the constraint playground section of the control
 * panel. Constraints are resolved once at addLayer() time, so the panel removes the layer
 * and calls this again with the newly selected `*To*Of` fields.
 */
export function addConstraintMarker(dmd: Dmd, position: LayerPosition): void {
    dmd.addLayer(TextLayer, CONSTRAINT_MARKER_ID, {
        width: 44,
        height: 12,
        position,
        text: 'marker',
        fontSize: 60,
        color: Colors.Black,
        backgroundColor: Colors.White,
        borderWidth: 1,
        borderColor: Colors.Red
    });
}
