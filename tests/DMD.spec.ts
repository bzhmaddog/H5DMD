import {setupJestCanvasMock} from 'jest-canvas-mock';

import {ChangeAlphaRenderer, DmdRenderer} from '../src/renderers';
import {Dmd} from '../src'
import {Options} from '../src/utils';
import {AnimationLayer, CanvasLayer, SpritesLayer} from '../src/layers';
import {DotShape} from "../src/enums";

jest.mock('../src/renderers/dmdRenderer');
jest.mock('../src/renderers/changeAlphaRenderer')

describe('testing entry file', () => {

    const canvas = document.createElement('canvas')

    canvas.width = 1280
    canvas.height = 390

    beforeEach(() => {
        jest.resetAllMocks();
        setupJestCanvasMock();

        const mockInit = jest.fn()
        DmdRenderer.prototype.init = mockInit
        ChangeAlphaRenderer.prototype.init = mockInit

        const mockRenderFrame = jest.fn()
        DmdRenderer.prototype.renderFrame = mockRenderFrame
        ChangeAlphaRenderer.prototype.renderFrame = mockRenderFrame
    });


    test('Class should be created', () => {
        const dmd = new Dmd(canvas, 2, 1, 1, 1, DotShape.Square, 14, 1, true)
        expect(dmd).toBeTruthy()
        expect(dmd).toBeInstanceOf(Dmd)
    });

    test('Created Layer should exist and match class CanvasLayer', () => {


        const dmd = new Dmd(canvas, 2, 1, 1, 1, DotShape.Square, 14, 1, true)

        const layer = dmd.addCanvasLayer('test', {}, new Options(), {}, (l) => {
            expect(l).toBe(layer)
        }, () => {
        })

        expect(layer).toBeTruthy()
        expect(layer instanceof CanvasLayer).toBe(true)
    });

    test('Created Layer should exist and match class AnimationLayer', () => {
        const dmd = new Dmd(canvas, 2, 1, 1, 1, DotShape.Square, 14, 1, true)
        const layer = dmd.addAnimationLayer('test', {}, new Options(), {}, (l) => {
            expect(l).toBe(layer)
        }, () => {
        })

        expect(layer).toBeTruthy()
        expect(layer instanceof AnimationLayer).toBe(true)
    });

    test('Created Layer should exist and match class SpritesLayer', () => {
        const dmd = new Dmd(canvas, 2, 1, 1, 1, DotShape.Square, 14, 1, true)
        const layer = dmd.addSpritesLayer('test', {}, new Options(), {}, (l) => {
            expect(l).toBe(layer)
        }, () => {
        })

        expect(layer).toBeTruthy()
        expect(layer instanceof SpritesLayer).toBe(true);
    });

    /*test('Created Layer should exist and match class TextLayer', () => {
        const dmd = new Dmd(canvas, 2, 1, 1, 1, DotShape.Square, 14, 1, true)
        const layer = dmd.addTextLayer('test', {}, new Options(), {}, (l) => {
            expect(l).toBe(layer)
        }, () => {})

        expect(layer).toBeTruthy()
        expect(layer instanceof TextLayer).toBe(true)
    });*/
});