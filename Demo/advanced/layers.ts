import {
    AnimationLayer,
    CanvasLayer,
    Colors,
    Dmd,
    SpritesLayer,
    TextLayer,
    VideoLayer,
    SpriteSequenceItem,
    NoiseEffectRenderer,
    ShakyRenderer,
    ChromaKeyRenderer,
    Utils,
    rendererEntry
} from "h5dmd";

/**
 * Add every demo layer (background, animation, video, images, text and sprites)
 * to the given Dmd instance.
 */
export function setupAdvancedLayers(dmd: Dmd, imagesPath: string): void {

    const noiseUrls: string[] = [];
    for (let i = 0; i < 6; i++) {
        noiseUrls.push(`${imagesPath}/noises/noise-${i}.png`);
    }

    const animationImagesUrls: string[] = [
        `${imagesPath}/animation/0.webp`,
        `${imagesPath}/animation/1.webp`,
        `${imagesPath}/animation/2.webp`,
        `${imagesPath}/animation/3.webp`,
        `${imagesPath}/animation/4.webp`,
        `${imagesPath}/animation/5.webp`,
        `${imagesPath}/animation/6.webp`,
        `${imagesPath}/animation/7.webp`,
        `${imagesPath}/animation/8.webp`,
        `${imagesPath}/animation/9.webp`,
        `${imagesPath}/animation/10.webp`,
        `${imagesPath}/animation/11.webp`,
        `${imagesPath}/animation/12.webp`,
        `${imagesPath}/animation/13.webp`,
        `${imagesPath}/animation/14.webp`
    ];

    const matthewImageUrl: string = `${imagesPath}/boss-matthew-big.png`

    const scottSpriteSheetUrl: string = `${imagesPath}/scott2x.png`

    // Background image + looping animation - the scene's backdrop, grouped so it can be
    // shown/hidden/faded as one unit. The group spans the whole DMD (default dimensions),
    // and so do the children unless they say otherwise.
    const backdrop = dmd.addLayerGroup('backdrop');

    backdrop.addLayer(
        CanvasLayer,
        'bg',
        {},
        async (layer) => {
            const bgURI = `${imagesPath}/boss-mode-bg.png`;
            console.log(`Fetching background image from: ${bgURI}`);
            const bitmap = await fetch(bgURI).then(r => r.blob()).then(createImageBitmap);
            layer.setDrawFunction(({ drawBitmap }) => drawBitmap(bitmap));
            layer.draw();
        });

    backdrop.addLayer(
        AnimationLayer,
        'animation',
        {
            height: 90,
            position: { top: 20 },
            duration: 800,
            autoplay: true,
            loop: true
        },
        async (layer) => {
            const bitmaps = await Utils.loadImagesOrdered(animationImagesUrls);
            layer.setAnimationData(bitmaps);
        });


    // The two demo videos are alternatives sharing the same slot - grouped so the shared
    // dimensions/position live on the group. Both start hidden; the control panel's
    // per-child visibility toggles pick which one shows.
    const videos = dmd.addLayerGroup('videos', {
        width: 213,
        height: 130,
        position: { left: 110 },
    });

    videos.addLayer(
        VideoLayer,
        'video-transparent',
        {
            autoplay: true,
            loop: true,
            visible: false
        },
        (layer) => {

            const video = document.createElement('video');

            video.addEventListener('loadeddata', function () {
                layer.setVideo(video);
            });

            video.src = `${imagesPath}/transparent-video.webm`;
        });

    videos.addLayer(
        VideoLayer,
        'video-chromakey',
        {
            autoplay: true,
            loop: true,
            visible: false,
            renderers: [
                rendererEntry('chroma-key', ChromaKeyRenderer, { color: [0, 0, 0], threshold: 9 })
            ]
        },
        (l) => {

            const video = document.createElement('video');

            video.addEventListener('loadeddata', function () {
                l.setVideo(video);
            });

            video.src = `${imagesPath}/sample.webm`;
        });

    dmd.addLayer(
        CanvasLayer,
        'matthew',
        {
            width: 218,
            height: 91,
            position: { hAlign: 'end', vAlign: 'center', hOffset: -1 }
        },
        async (layer) => {
            const bitmap = await fetch(matthewImageUrl).then(r => r.blob()).then(createImageBitmap);
            layer.drawBitmap(bitmap);
        }
    );

    // The two character-name captions, one per corner - grouped so they show/hide/fade
    // as one unit. The group spans the whole DMD (default dimensions); each child aligns
    // within it exactly as it previously aligned within the DMD.
    const names = dmd.addLayerGroup('names');

    names.addLayer(
        TextLayer,
        'text1',
        {
            width: 100,
            height: 17,
            text: "Scott Pilgrim",
            fontSize: 80,
            adjustWidth: true,
        }
    );

    names.addLayer(
        TextLayer,
        'text4',
        {
            width: 95,
            height: 15,
            position: { hAlign: 'end', vAlign: 'end' },
            text: "Matthew Patel",
            fontSize: 80,
            adjustWidth: true
        }
    );

    // The two "VS" text layers occupy the same spot and belong together - a LayerGroup
    // positions them as one unit, so the shared alignment lives on the group instead of
    // being duplicated on each layer. The children inherit the group's dimensions and
    // rely on TextLayer defaults (Arial, centered white text) where they apply.
    const vs = dmd.addLayerGroup('vs', {
        width: 100,
        height: 52,
        position: { hAlign: 'center', vAlign: 'center', hOffset: -60 },
    });

    vs.addLayer(
        TextLayer,
        'vsin',
        {
            text: "VS",
            fontSize: 95,
            fontStyle: 'italic bold',
            adjustWidth: true,
        },
        async (layer) => {
            const bitmaps = await Utils.loadImagesOrdered(noiseUrls);
            const noiseData = Utils.bitmapsToPixelData(bitmaps, layer.width, layer.height);
            await layer.addRenderer('noise-effect', NoiseEffectRenderer, { duration: 200, noises: noiseData });
        }
    );

    vs.addLayer(
        TextLayer,
        'vsout',
        {
            text: "VS",
            fontSize: 95,
            fontStyle: 'italic bold',
            color: '#00000000',
            strokeWidth: 2,
            strokeColor: Colors.Red,
            adjustWidth: true
        },
        async (l) => {
            await l.addRenderer('shaky-effect', ShakyRenderer, { intensity: 0.8, speed: 160, mode: "random" });
        }
    );

    dmd.addLayer(
        SpritesLayer,
        'sprite',
        {
            width: 110,
            height: 130
        },
        async (layer) => {
            const bitmap = await fetch(scottSpriteSheetUrl).then(r => r.blob()).then(createImageBitmap);

            await layer.createSprite(
                        'scott',
                        bitmap,
                        6,
                        0,
                        [
                            {
                                key: "idle",
                                animationParams: {
                                    nbFrames: 8,
                                    width: 72,
                                    height: 118,
                                    xOffset: 0,
                                    yOffset: 0,
                                    duration: 900
                                }
                            },
                            {
                                key: 'walk',
                                animationParams: {
                                    nbFrames: 6,
                                    width: 72,
                                    height: 126,
                                    xOffset: 0,
                                    yOffset: 118,
                                    duration: 1100
                                }
                            },
                            {
                                key: 'run',
                                animationParams: {
                                    nbFrames: 8,
                                    width: 106,
                                    height: 120,
                                    xOffset: 0,
                                    yOffset: 244,
                                    duration: 650
                                }
                            },
                            {
                                key: 'idle2',
                                animationParams: {
                                    nbFrames: 4,
                                    width: 92,
                                    height: 124,
                                    xOffset: 0,
                                    yOffset: 364,
                                    duration: 900
                                }
                            },
                            {
                                key: 'taunt',
                                animationParams: {
                                    nbFrames: 9,
                                    width: 92,
                                    height: 124,
                                    xOffset: 0,
                                    yOffset: 488,
                                    duration: 450
                                }
                            }
                        ],
                        '2%',
                        '2%'
                    );

            const seq: SpriteSequenceItem[] = [
                {key: 'idle', nbLoop: 3},
                {key: 'walk', nbLoop: 5},
                {key: 'run', nbLoop: 4},
                {key: 'taunt', nbLoop: 1}
            ];
            layer.enqueueSequence('scott', seq, true);
            layer.run('scott');
        });

    // SVG title layer — centered, initially hidden
    dmd.addLayer(
        CanvasLayer,
        'svg-title',
        { visible: false },
        async (layer) => {
            const img = new Image();
            await new Promise<void>(resolve => { img.onload = () => resolve(); img.src = `${imagesPath}/sptitle.svg`; });
            const bitmap = await createImageBitmap(img);
            layer.setDrawFunction(({ drawBitmap }) => {
                drawBitmap(bitmap, { hAlign: 'center', vAlign: 'center', margin: 5 });
            });
            layer.draw();
        }
    );

    // Interactive text demo layer — shows text options (outline, shaky, adjustWidth)
    dmd.addLayer(
        TextLayer,
        'big-text-demo',
        {
            width: 426,
            height: 94,
            position: { vAlign: 'center' },
            text: 'Hello DMD!',
            fontFamily: 'Arial',
            fontSize: 90,
            fontUnit: '%',
            fontStyle: 'bold',
            color: Colors.Orange,
            adjustWidth: true,
            outlineWidth: 2,
            outlineColor: Colors.DarkOrange,
            backgroundColor: Colors.Black,
            backgroundOpacity: 0.8,
            borderColor: Colors.White,
            borderWidth: 2,
            visible: false,
        }
    );
}
