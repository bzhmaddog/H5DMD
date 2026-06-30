import {
    Colors,
    Dmd,
    SpriteSequenceItem,
    NoiseEffectRenderer,
    ChromaKeyRenderer,
    Options,
    Utils
} from "h5dmd";

/**
 * Add every demo layer (background, animation, video, images, text and sprites)
 * to the given Dmd instance.
 */
export function setupLayers(dmd: Dmd, imagesPath: string, chromaKey: ChromaKeyRenderer): void {

    const noises: string[] = [];
    for (let i = 0; i < 6; i++) {
        noises.push(`${imagesPath}/noises/noise-${i}.png`);
    }

    dmd.addCanvasLayer('bg', {}, {} as Options, {}, (layer) => {

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


    dmd.addAnimationLayer(
        'animation',
        {
            width: 426,
            height: 90,
            top: 20,
            left: 0
        },
        new Options({
            duration: 800,
            autoplay: true,
            loop: true
        }),
        {},
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


    dmd.addVideoLayer(
        'video-transparent',
        {
            width: 213,
            height: 130,
            top: 0,
            left: 110
        },
        new Options({
            autoplay: true,
            width: 213,
            height: 130,
            loop: true,
            stopOnHide: true,
            visible: false
        }),
        {},
        (layer) => {

            const video = document.createElement('video');

            video.addEventListener('loadeddata', function () {
                layer.setVideo(video);
            });

            video.src = `${imagesPath}/transparent-video.webm`;
        });

    dmd.addVideoLayer(
        'video-chromakey',
        {
            width: 213,
            height: 130,
            top: 0,
            left: 110
        },
        new Options({
            autoplay: true,
            width: 213,
            height: 130,
            loop: true,
            stopOnHide: true,
            visible: false,
            renderers: ['chroma']
        }),
        { 'chroma': chromaKey },
        (layer) => {

            const video = document.createElement('video');

            video.addEventListener('loadeddata', function () {
                layer.setVideo(video);
            });

            video.src = `${imagesPath}/sample.webm`;
        });

    dmd.addCanvasLayer(
        'matthew',
        {
            width: 218,
            height: 91,
            hAlign: 'right',
            vAlign: 'middle',
            hOffset: -1,
        },
        {} as Options,
        {},
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

    dmd.addTextLayer(
        'text1',
        {
            width: 100,
            height: 17
        },
        new Options({
            text: "Scott Pilgrim",
            left: 0,
            top: 1,
            fontSize: 80,
            adjustWidth: true
            //debug : true
        })
    );

    dmd.addTextLayer(
        'text2',
        {
            width: 90,
            height: 52,
            hAlign: 'center',
            vAlign: 'middle',
            hOffset: -60,
        },
        new Options({
            text: "VS",
            fontFamily: 'Arial',
            fontSize: 100,
            hAlign: 'center',
            vAlign: 'middle',
            fontStyle: 'italic bold',
            color: '#FFFFFF', // RGB,
            adjustWidth: true,
            renderers: ['score-effect']
        }),
        {
            "score-effect": new NoiseEffectRenderer(90, 52, 200, noises)
        }
    );

    dmd.addTextLayer(
        'text3',
        {
            width: 90,
            height: 52,
            hAlign: 'center',
            vAlign: 'middle',
            hOffset: -60,
        },
        new Options({
            text: "VS",
            fontFamily: 'Arial',
            fontSize: 100,
            hAlign: 'center',
            vAlign: 'middle',
            fontStyle: 'italic bold',
            color: '#00000000', // inner color totaly transparent to create an hollow text
            strokeWidth: 2,
            strokeColor: Colors.Red,
            adjustWidth: true
        })
    );

    dmd.addTextLayer(
        'text4',
        {
            width: 95,
            height: 15,
            hAlign: 'right',
            vAlign: 'bottom',
            hOffset: -1
        },
        new Options({
            text: "Matthew Patel",
            fontSize: 80,
            adjustWidth: true
        })
    );

    dmd.addSpritesLayer(
        'sprite',
        {
            width: 110,
            height: 130
        },
        {} as Options,
        {},
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
}
