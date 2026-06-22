import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

import {beforeEach, describe, expect, test, vi} from 'vitest';
import {setupVitestCanvasMock} from 'vitest-canvas-mock';

import {ChangeAlphaRenderer, DmdRenderer} from '../src/renderers';
import {Dmd} from '../src'
import {Options} from '../src/utils';
import {AnimationLayer, CanvasLayer, SpritesLayer} from '../src/layers';
import {DotShape} from "../src/enums";

vi.mock('../src/renderers/dmd-renderer');
vi.mock('../src/renderers/change-alpha-renderer')

describe('testing entry file', () => {

    const canvas = document.createElement('canvas')

    canvas.width = 1280
    canvas.height = 390

    beforeEach(() => {
        vi.resetAllMocks();
        setupVitestCanvasMock();

        const mockInit = vi.fn()
        DmdRenderer.prototype.init = mockInit
        ChangeAlphaRenderer.prototype.init = mockInit

        const mockRenderFrame = vi.fn()
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

    test('Dmd.version should be a non-empty semver string', () => {
        expect(typeof Dmd.version).toBe('string')
        expect(Dmd.version).toMatch(/^\d+\.\d+\.\d+$/)
    });

    test('Instance version getter should return the static version', () => {
        const dmd = new Dmd(canvas, 2, 1, 1, 1, DotShape.Square, 14, 1, true)
        expect(dmd.version).toBe(Dmd.version)
    });

    test('Dmd.version should stay in sync with package.json', () => {
        const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'))
        expect(Dmd.version).toBe(pkg.version)
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