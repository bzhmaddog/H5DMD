# H5DMD
A Virtual DMD (Dot Matrix Display) powered by HTML5 Canvas and WebGPU(optional)

![256x78 DMD on a 1280x390 display](/dmd-256x78-mp-logo.jpg?raw=true "1 dot = 4x4 pixels")

Quick demonstration videos (tests before using mpf):

https://youtu.be/ItiX97USKyU

https://www.youtube.com/watch?v=MtAN4vKRLQ0

https://www.youtube.com/watch?v=MaJZQCTSiOg


# Installation
Put all mjs files in your project


# Initialization Example

```
import { DMD } from './dmd/DMD.mjs';

// Output canvas
let canvas = document.getElementById('my-canvas');

/**
 * DMD(
 *    {number of horizontal dots},
 *    {number of vertical dots},
 *    {canvas width},
 *    {canvas height},
 *    {width of dot},
 *    {height of dot},
 *    {horizontal space between dots},
 *    {vertical space between dots},
 *    {horizontal offset},
 *    {vertical offset},
 *    {dot shape},
 *    {output canvas},
 *    {show FPS info}
 * )
 */

let dmd = new DMD(256, 78, 1280, 390, 4, 4, 1, 1, 1, 1, DMD.DotShape.Square, canvas, true);

// Start rendering
dmd.run();
```

# Usage example

```
// Adding an Image layer
dmd.addLayer({
    name :'logo',
    type : 'image',
    src : 'images/logo.webp',
    mimeType : 'image/webp',
});

// Adding a text layer
let textLayer = dmd.addLayer({ name : 'test-text', type : 'text'});

// Add text with fixed position
textLayer.content.addText('aText', 'Hello World', {
    fontSize : '30',
    fontFamily : 'Arial',
    left : 0,
    top : 0,
    color : 'white',
    strokeWidth : 2,
    strokeColor : 'black'
});

// Add text with aligment
textLayer.content.addText('anotherText', 'Centered', {
    fontSize : '30',
    fontFamily : 'Arial',
    align : 'center', // possible values are left,center,right => use along xOffset to alter position
    vAlign : 'middle', // possible values are top,middle,bottom => use along yOffset to alter position
    color : 'white',
    strokeWidth : 2,
    strokeColor : 'black'
});

// Video layer
dmd.addLayer({
    name :'video',
    type : 'video',
    src : 'intro.webm',
    mimeType : 'image/webm',
});

// Sprites layer
let spritesLayer = dmd.addLayer({ name :'test-sprites', type : 'sprite'});

let testSprite = new Sprite("sprites/scott.png", 3, 0).then(sprite => {

    sprite.addAnimation('idle', 8, 36, 59, 0, 0, .16);
    sprite.addAnimation('walk', 6, 36, 63, 0, 59, .12);
    sprite.addAnimation('run', 8, 53, 60, 0, 122, .20);
    sprite.addAnimation('idle2', 4, 46, 62, 0, 182, .09);
    sprite.addAnimation('taunt', 9, 46, 62, 0, 244, .25);

    
    spritesLayer.content.addSprite("scott", 50, 15, sprite);

    sprite.enqueueSingle('taunt', 1);
    sprite.enqueueSingle('idle', 1);

    let seq = [
        ['idle' , 3],
        ['walk' , 5],
        ['run', 4],
        ['taunt', 1]
    ];

    sprite.enqueueSequence(seq, true);

    sprite.run();
});

// Or
var spriteLayer = dmd.addLayer({
    name :'sprite-layer',
    type : 'sprite'
});

PubSub.subscribe("sprite.queue.finished", function(event, data){
    console.log("Queue finished", data);
});

spriteLayer.content.createSprite(
    "scott",
    "sprites/scott.png",
    3,
    0,
    [
        ['idle', 8, 36, 59, 0, 0, .16],
        ['walk', 6, 36, 63, 0, 59, .12],
        ['run', 8, 53, 60, 0, 122, .20],
        ['idle2', 4, 46, 62, 0, 182, .09],
        ['taunt', 9, 46, 62, 0, 244, .25]
    ],
    10,
    2
).then( () => {

    let seq = [
        ['idle' , 3],
        ['walk' , 5],
        ['run', 4],
        ['taunt', 1]
    ];

    s.content.enqueueSequence('scott', seq, false);
    s.content.run('scott');

});

// Canvas layer
var canvasLayer = dmd.addLayer({
    name :'sprite-layer',
    type : 'canvas'
});

canvasLayer.content.drawImage('images/test.png', 0, 0, 100, 100); // width and height are optional

var img = new Image();

img.onload = function() {
    canvasLayer.content.drawImage(img, 0, 0, 100, 100); // width and height are optional
}

img.src = "test.src";

// Animation layer
var animLayer = this.#dmd.addLayer({
    name :'anim',
    type : 'animation',
    loop : true,
    duration : 800,
});

animLayer.content.loadImages([
    'animations/boss-mode/0.webp',
    'animations/boss-mode/1.webp',
    'animations/boss-mode/2.webp',
    'animations/boss-mode/3.webp',
    'animations/boss-mode/4.webp',
    'animations/boss-mode/5.webp',
    'animations/boss-mode/6.webp',
    'animations/boss-mode/7.webp',
    'animations/boss-mode/8.webp',
    'animations/boss-mode/9.webp',
    'animations/boss-mode/10.webp',
    'animations/boss-mode/11.webp',
    'animations/boss-mode/12.webp',
    'animations/boss-mode/13.webp',
    'animations/boss-mode/14.webp'
]).then(() => {
    animLayer.content.play();
});


// Change layer visibilitity
spritesLayer.setVisibility(false);
// or
dmd.hideLayer('test-sprites');
// or
dmd.showLayer('test-sprites');

// Only visible layers are rendered onto the DMD but there drawing routine still runs and consume CPU time so if you really don't need a layer anymore
// it can be Removed
dmd.removeLayer('test-sprites');
// or
dmd.removeLayer(spritesLayer);

```

