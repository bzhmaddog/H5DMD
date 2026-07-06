import {Colors, Dmd, LayerGroup, TextLayer, NoiseEffectRenderer, rendererEntry, ShakyRenderer, Utils} from "h5dmd";

/**
 * Build a pinball-style scoreboard out of three independent top-level LayerGroups: the
 * score display, the player indicator ("P" + player number), and the ball indicator
 * ("BALL" + ball number) - each a compound element made of several TextLayers that need to
 * move/show/hide together as one unit, which is exactly what LayerGroup is for.
 */
export async function setupScoreboardLayers(dmd: Dmd, imagesPath: string): Promise<void> {

    const noiseUrls: string[] = [];
    for (let i = 0; i < 6; i++) {
        noiseUrls.push(`${imagesPath}/noises/noise-${i}.png`);
    }

    const bitmaps = await Utils.loadImagesOrdered(noiseUrls);

    // Load the custom score font. The FontFace must finish loading before the TextLayer
    // below draws its first frame, otherwise the canvas silently falls back to the default
    // font for that frame (document.fonts.add() alone doesn't wait for the font data).
    const fontsPath = imagesPath.replace(/images$/, 'fonts');
    const dustyFont = new FontFace('Dusty', `url(${fontsPath}/Dusty.otf)`);
    await dustyFont.load();
    document.fonts.add(dustyFont);

    // Must match the score group's own width/height below - the NoiseEffectRenderer's GPU
    // buffer is sized from the layer it's attached to, not from this pixel data's own size.
    const scoreWidth = 426;
    const scoreHeight = 90;
    const noiseData = Utils.bitmapsToPixelData(bitmaps, scoreWidth, scoreHeight);

    // ---------------------------------------------------------------------
    // Score - big outlined digits, right-aligned
    // ---------------------------------------------------------------------
    const score = dmd.addLayer(LayerGroup, 'score', {
        width: scoreWidth,
        height: scoreHeight,
        position: {hAlign: 'right', vAlign: 'middle'},
        renderers: [
            rendererEntry('noise', NoiseEffectRenderer,  { duration: 200, noises: noiseData }, true)
        ]
    });

    score.addLayer(TextLayer, 'value', {
        text: '0',
        hAlign: 'right',
        vAlign: 'middle',
        fontFamily: 'Dusty',
        hOffset: 8, // Fix Dusty font issue
        fontSize: 90,
        adjustWidth: true,
        adjustDirection: 'shrink',
        color: Colors.White,
        outlineWidth: 2,
        outlineColor: Colors.Blue,
    });

    // ---------------------------------------------------------------------
    // Player indicator (bottom-left) - "P" label + player number
    // ---------------------------------------------------------------------
    const player = dmd.addLayer(LayerGroup, 'player', {
        width: 40,
        height: 18,
        position: {left: 4, vAlign: 'bottom', vOffset: -4},
    });

    player.addLayer(TextLayer, 'label', {
        width: 14,
        height: 18,
        position: {top: 0, left: 0},
        text: 'P:',
        fontSize: 90,
        color: Colors.White,
    });

    player.addLayer(TextLayer, 'number', {
        width: 10,
        height: 18,
        position: {
            hAlign: 'constraint', leftToRightOf: 'label',
            vAlign: 'constraint', topToTopOf: 'label',
            hOffset: 1,
        },
        text: '1',
        fontSize: 90,
        color: Colors.Yellow,
        renderers: [
            rendererEntry('shake', ShakyRenderer, {intensity: 1, speed: 12, mode: 'random'}, false)
        ],
    });

    // ---------------------------------------------------------------------
    // Ball indicator (bottom-right) - "BALL" label + ball number
    // ---------------------------------------------------------------------
    const ball = dmd.addLayer(LayerGroup, 'ball', {
        width: 50,
        height: 18,
        position: {hAlign: 'right', vAlign: 'bottom', vOffset: -4}
    });

    ball.addLayer(TextLayer, 'label', {
        width: 34,
        height: 20,
        position: {top: 0, left: 0},
        text: 'Ball:',
        fontSize: 90,
        color: Colors.White,
        hAlign: 'right',
    });

    ball.addLayer(TextLayer, 'number', {
        width: 10,
        height: 20,
        position: {
            hAlign: 'constraint', leftToRightOf: 'label', hOffset: 2,
            vAlign: 'constraint', topToTopOf: 'label',
        },
        text: '1',
        fontSize: 100,
        color: Colors.Yellow,
        hAlign: 'left',
        renderers: [
            rendererEntry('shake', ShakyRenderer, {intensity: 1, speed: 12, mode: 'random'}, false)
        ],
    });
}
