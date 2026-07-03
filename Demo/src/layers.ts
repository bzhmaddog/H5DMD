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
export function setupLayers(dmd: Dmd, imagesPath: string): void {

    const noises: string[] = [];
    for (let i = 0; i < 6; i++) {
        noises.push(`${imagesPath}/noises/noise-${i}.png`);
    }

    dmd.addLayer(
        CanvasLayer,
        'bg',
        {},
        (layer) => {

        const bgURI = `${imagesPath}/boss-mode-bg.png`;

        console.log(`Fetching background image from: ${bgURI}`);

        fetch(
            bgURI
        )
        .then(response => response.blob())
        .then(blob => createImageBitmap(blob))
        .then(bitmap => {

            layer.setDrawFunction(({ drawBitmap }) => {
                drawBitmap(bitmap);
            });

            layer.draw(); // Draw the layer content once to initialize it            
        });
    });


    dmd.addLayer(
        AnimationLayer,
        'animation',
        {
            width: 426,
            height: 90,
            position: { top: 20, left: 0 },
            duration: 800,
            autoplay: true,
            loop: true
        },
        (layer) => {

            const images = [
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

            Utils
                .loadImagesOrdered(images)
                .then((bitmaps) => {
                    layer.setAnimationData(bitmaps);
                });

        });


    dmd.addLayer(
        VideoLayer,
        'video-transparent',
        {
            width: 213,
            height: 130,
            position: { left: 110 },
            autoplay: true,
            loop: true,
            stopOnHide: true,
            visible: false
        },
        (layer) => {

            const video = document.createElement('video');

            video.addEventListener('loadeddata', function () {
                layer.setVideo(video);
            });

            video.src = `${imagesPath}/transparent-video.webm`;
        });

    dmd.addLayer(
        VideoLayer,
        'video-chromakey',
        {
            width: 213,
            height: 130,
            position: { left: 110 },
            autoplay: true,
            loop: true,
            stopOnHide: true,
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
            position: { hAlign: 'right', vAlign: 'middle', hOffset: -1 }
        },
        (layer) => {

            const bgURI = `${imagesPath}/boss-matthew-big.png`;

            fetch(bgURI)
                .then(response => response.blob())
                .then(blob => createImageBitmap(blob))
                .then(bitmap => {
                    layer.drawBitmap(bitmap);
                });
        }
    );

    dmd.addLayer(
        TextLayer,
        'text1',
        {
            width: 100,
            height: 17,
            text: "Scott Pilgrim",
            left: 0,
            top: 2,
            fontSize: 80,
            adjustWidth: true,
        }
    );

    dmd.addLayer(
        TextLayer,
        'text2',
        {
            width: 90,
            height: 52,
            position: { hAlign: 'center', vAlign: 'middle', hOffset: -60 },
            text: "VS",
            fontFamily: 'Arial',
            fontSize: 100,
            hAlign: 'center',
            vAlign: 'middle',
            fontStyle: 'italic bold',
            color: '#FFFFFF',
            adjustWidth: true,
            renderers: [
                rendererEntry('noise-effect', NoiseEffectRenderer, { intensity: 200, noises })
            ]
        }
    );

    dmd.addLayer(
        TextLayer,
        'text3',
        {
            width: 90,
            height: 52,
            position: { hAlign: 'center', vAlign: 'middle', hOffset: -60 },
            text: "VS",
            fontFamily: 'Arial',
            fontSize: 100,
            hAlign: 'center',
            vAlign: 'middle',
            fontStyle: 'italic bold',
            color: '#00000000',
            strokeWidth: 2,
            strokeColor: Colors.Red,
            adjustWidth: true,
        },
        (l) => {
            l.addRenderer('shaky-effect', ShakyRenderer, { intensity: 0.8, speed: 160, mode: "random" });
        }
    );

    dmd.addLayer(
        TextLayer,
        'text4',
        {
            width: 95,
            height: 15,
            position: { hAlign: 'right', vAlign: 'bottom' },
            text: "Matthew Patel",
            fontSize: 80,
            adjustWidth: true
        }
    );

    dmd.addLayer(
        SpritesLayer,
        'sprite',
        {
            width: 110,
            height: 130
        },
        (layer) => {

            const bgURI = `${imagesPath}/scott2x.png`;

            fetch(bgURI)
                .then(response => response.blob())
                .then(blob => createImageBitmap(blob))
                .then(bitmap => {

                    layer.createSprite(
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
                                    duration: 900 // 900
                                }
                            }, //800
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
                    ).then(() => {
                        const seq: SpriteSequenceItem[] = [
                            {key: 'idle', nbLoop: 3},
                            {key: 'walk', nbLoop: 5},
                            {key: 'run', nbLoop: 4},
                            {key: 'taunt', nbLoop: 1}
                            //['idle2', 1]
                        ];

                        layer.enqueueSequence('scott', seq, true);
                        layer.run('scott');
                    });

                });

        });

    // SVG title layer — centered, initially hidden
    dmd.addLayer(
        CanvasLayer,
        'svg-title',
        { visible: false },
        (layer) => {
            const img = new Image();
            img.onload = () => {
                createImageBitmap(img).then(bitmap => {
                    layer.setDrawFunction(({ drawBitmap }) => {
                        drawBitmap(bitmap, { hAlign: 'center', vAlign: 'middle', margin: 5 });
                    });
                    layer.draw();
                });
            };
            img.src = `${imagesPath}/sptitle.svg`;
        }
    );
}
