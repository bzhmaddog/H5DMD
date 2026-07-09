import {Colors, Dmd, LayerGroup, TextLayer, CanvasLayer, NoiseEffectRenderer, rendererEntry, ShakyRenderer, Utils} from "h5dmd";

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
        hOffset: 14, // Fix Dusty font issue
        fontSize: 90,
        adjustWidth: true,
        adjustDirection: 'shrink',
        color: Colors.White,
        outlineWidth: 2,
        outlineColor: Colors.Blue
    });

    // ---------------------------------------------------------------------
    // Player indicator (bottom-left) - "P" label + player number
    // ---------------------------------------------------------------------
    const player = dmd.addLayer(LayerGroup, 'player', {
        width: 35,
        height: 18,
        position: {left: 4, vAlign: 'bottom'}
    });

    player.addLayer(
        CanvasLayer,
        'icon',
        {
            width: 18,
            height: 18,
            position: {top: 0, left: 0},
        },
        async (layer) => {
            const bgURI = `${imagesPath}/scott-face.webp`;
            const bitmap = await fetch(bgURI).then(r => r.blob()).then(createImageBitmap);
            layer.setDrawFunction(({ drawBitmap }) => drawBitmap(bitmap));
            layer.draw();
        }
    );

    player.addLayer(TextLayer, 'number', {
        width: 10,
        height: 18,
        position: {
            hAlign: 'constraint', leftToRightOf: 'icon',
            vAlign: 'constraint', topToTopOf: 'icon',
            hOffset: 1, vOffset: 1
        },
        text: '1',
        fontSize: 100,
        adjustWidth: true,
        color: Colors.Yellow,
        renderers: [
            rendererEntry('shake', ShakyRenderer, {intensity: 1, speed: 12, mode: 'random'}, false)
        ],
    });

    // ---------------------------------------------------------------------
    // Ball indicator (bottom-right) - "B" label + ball number
    // ---------------------------------------------------------------------
    const ball = dmd.addLayer(LayerGroup, 'ball', {
        width: 35,
        height: 20,
        position: {hAlign: 'right', vAlign: 'bottom'}
    });

    ball.addLayer(
        CanvasLayer,
        'icon',
        {
            width: 18,
            height: 18,
            position: {top: 1, left: 2}
        },
        async (layer) => {
            const bgURI = `${imagesPath}/ball.webp`;
            const bitmap = await fetch(bgURI).then(r => r.blob()).then(createImageBitmap);
            layer.setDrawFunction(({ drawBitmap }) => drawBitmap(bitmap));
            layer.draw();
        }
    );

    ball.addLayer(TextLayer, 'number', {
        width: 10,
        height: 20,
        position: {
            hAlign: 'constraint', leftToRightOf: 'icon',
            vAlign: 'constraint', topToTopOf: 'icon',
            hOffset: 2, vOffset: -1
        },
        text: '1',
        fontSize: 70,
        color: Colors.Yellow,
        hAlign: 'left',
        renderers: [
            rendererEntry('shake', ShakyRenderer, {intensity: 1, speed: 12, mode: 'random'}, false)
        ],
    });
}
