import {
    AnimationLayer,
    CanvasLayer,
    Colors,
    Dmd,
    DotShape,
    ISpriteSequenceItem,
    NoiseEffectRenderer,
    Options,
    SpritesLayer,
    Utils,
    VideoLayer
} from "h5dmd";

// When dom is loaded create the objects and bind the events
document.addEventListener('DOMContentLoaded', function () {

    const imagesPath = document.baseURI.replace('index.html', '') + 'images';

    // Check if webgpu is supported
    if ("gpu" in navigator) {

        const output = document.getElementById('output') as HTMLCanvasElement;
        const dmd = new Dmd(output, 2, 1, 1, 1, DotShape.Square, 14, 1, true);


        const noises: string[] = [];
        for (let i = 0; i < 6; i++) {
            noises.push(`${imagesPath}/noises/noise-${i}.png`);
        }

        // Init Dmd then
        dmd.init().then(() => {
            // Start rendering dmd
            dmd.run();


            dmd.addCanvasLayer('bg', {}, {} as Options, {}, (layer: CanvasLayer) => {

                const bgURI = `${imagesPath}/boss-mode-bg.png`;

                fetch(bgURI)
                    .then(response => response.blob())
                    .then(blob => createImageBitmap(blob))
                    .then(bitmap => {
                        layer.drawBitmap(bitmap);
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
                (layer: AnimationLayer) => {

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
                'video',
                {
                    width: 231,
                    height: 130,
                    top: 0,
                    left: 0
                },
                new Options({
                    autoplay: true,
                    width: 426,
                    height: 130,
                    loop: true,
                    stopOnHide: true,
                    visible: false
                }),
                {},
                (layer: VideoLayer) => {

                    const video = document.createElement('video');

                    video.addEventListener('loadeddata', function () {
                        layer.setVideo(video); // autoplay = true so no need to call play here
                    });

                    video.src = `${imagesPath}/transparent-video.webm`;
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
                (layer: CanvasLayer) => {

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
                    top: 0,
                    fontSize: 80,
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
                    strokeColor: Colors.Red
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
                    fontSize: 80
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
                (layer: SpritesLayer) => {

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
                                const seq: ISpriteSequenceItem[] = [
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


            const checkboxElems = document.querySelectorAll("input[type='checkbox']");

            for (let i = 0; i < checkboxElems.length; i++) {
                checkboxElems[i].addEventListener("click", function (event: Event) {
                    const element = event.target as HTMLInputElement;

                    if (element) {

                        const layerName = element.dataset.layer ?? '';
                        const visible = element.checked ?? false;
                        const layer = dmd.getLayer(layerName);

                        if (layer != null) {
                            layer.setVisibility(visible);

                            if (visible) {
                                if (layerName === "sprite") {
                                    (layer as SpritesLayer).run('scott');
                                }
                            }

                        } else {
                            console.log(`Layer not found : ${layerName}`);
                        }
                    }
                });
            }

        }); // Dmd.init()

    } else {
        alert('Sorry your browser does not support WEBGPU (or the feature is not enabled)');
    }
}, false); // DOM loaded
