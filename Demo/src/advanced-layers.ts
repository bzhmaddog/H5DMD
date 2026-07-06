import {
    CanvasLayer,
    ChromaKeyRenderer,
    Colors,
    Dmd,
    LayerGroup,
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

export function setupAdvancedLayers(dmd: Dmd, imagesPath: string): void {

    // ---------------------------------------------------------------------
    // Video panel (top-left, red) - hiding the group pauses the child video's playback
    // ---------------------------------------------------------------------
    const videoPanel = dmd.addLayer(LayerGroup, 'video-panel', {
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
        stopOnHide: true,
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
    const hud = dmd.addLayer(LayerGroup, 'hud', {
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
        width: 60,
        height: 12,
        position: {top: 2, left: 4},
        text: 'HUD',
        fontSize: 90,
        color: Colors.White,
    });

    // Nested LayerGroup - the 3-level case (Dmd -> hud -> badge -> leaf layers).
    const badge = hud.addLayer(LayerGroup, 'badge', {
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
    const sandbox = dmd.addLayer(LayerGroup, 'sandbox', {
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
    const info = dmd.addLayer(LayerGroup, 'info', {
        width: QUADRANT_WIDTH,
        height: QUADRANT_HEIGHT,
        position: {top: QUADRANT_HEIGHT, left: QUADRANT_WIDTH},
        backgroundColor: Colors.Blue,
        backgroundOpacity: 0.3,
    });

    info.addLayer(TextLayer, 'caption', {
        text: 'Hello DMD!',
        hAlign: 'center',
        vAlign: 'middle',
        fontSize: 80,
        adjustWidth: true,
        color: Colors.White,
    });
}
