import {setupJestCanvasMock} from 'jest-canvas-mock';

import {DMDRenderer, DotShape} from '../src/renderers/DMDRenderer';
import {ChangeAlphaRenderer} from '../src/renderers/ChangeAlphaRenderer';
import {DMD} from '../src/DMD'
import {Options} from '../src/utils/Options';
import {CanvasLayer} from '../src/layers/CanvasLayer';
import {AnimationLayer} from "../src/layers/AnimationLayer";
import {SpritesLayer} from "../src/layers/SpritesLayer";

jest.mock('../src/renderers/DMDRenderer');
jest.mock('../src/renderers/ChangeAlphaRenderer')

describe('testing entry file', () => {

    const canvas = document.createElement('canvas')

    canvas.width = 1280
    canvas.height = 390

    beforeEach(() => {
        jest.resetAllMocks();
        setupJestCanvasMock();

        const mockInit = jest.fn()
        DMDRenderer.prototype.init = mockInit
        ChangeAlphaRenderer.prototype.init = mockInit

        const mockRenderFrame = jest.fn()
        DMDRenderer.prototype.renderFrame = mockRenderFrame
        ChangeAlphaRenderer.prototype.renderFrame = mockRenderFrame
    });


    test('Class should be created', () => {
        const dmd = new DMD(canvas, 2, 1, 1, 1, DotShape.Square, 14, 1, true)
        expect(dmd).toBeTruthy()
        expect(dmd).toBeInstanceOf(DMD)
    });

    test('Created Layer should exist and match class CanvasLayer', () => {


        const dmd = new DMD(canvas, 2, 1, 1, 1, DotShape.Square, 14, 1, true)

        const layer = dmd.addCanvasLayer('test', {}, new Options(), {}, (l) => {
            expect(l).toBe(layer)
        }, () => {
        })

        expect(layer).toBeTruthy()
        expect(layer instanceof CanvasLayer).toBe(true)
    });

    test('Created Layer should exist and match class AnimationLayer', () => {
        const dmd = new DMD(canvas, 2, 1, 1, 1, DotShape.Square, 14, 1, true)
        const layer = dmd.addAnimationLayer('test', {}, new Options(), {}, (l) => {
            expect(l).toBe(layer)
        }, () => {
        })

        expect(layer).toBeTruthy()
        expect(layer instanceof AnimationLayer).toBe(true)
    });

    test('Created Layer should exist and match class SpritesLayer', () => {
        const dmd = new DMD(canvas, 2, 1, 1, 1, DotShape.Square, 14, 1, true)
        const layer = dmd.addSpritesLayer('test', {}, new Options(), {}, (l) => {
            expect(l).toBe(layer)
        }, () => {
        })

        expect(layer).toBeTruthy()
        expect(layer instanceof SpritesLayer).toBe(true);
    });

    /*test('Created Layer should exist and match class TextLayer', () => {
        const dmd = new DMD(canvas, 2, 1, 1, 1, DotShape.Square, 14, 1, true)
        const layer = dmd.addTextLayer('test', {}, new Options(), {}, (l) => {
            expect(l).toBe(layer)
        }, () => {})

        expect(layer).toBeTruthy()
        expect(layer instanceof TextLayer).toBe(true)
    });*/
});