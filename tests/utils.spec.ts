/**
 * Unit tests for the Utils static colour/string helpers and the ordered image
 * loader (with fetch / createImageBitmap stubbed).
 */
import {afterEach, describe, expect, test, vi} from 'vitest'

import {Utils} from '../src/utils'

describe('Utils colour and string helpers', () => {

    test('hexRGBToHexRGBA appends a valid alpha byte', () => {
        expect(Utils.hexRGBToHexRGBA('#FF0000', '80')).toBe('#FF000080')
        expect(Utils.hexRGBToHexRGBA('#abcdef', 'ff')).toBe('#abcdefff')
    })

    test('hexRGBToHexRGBA rejects a non-hex alpha', () => {
        expect(() => Utils.hexRGBToHexRGBA('#FF0000', 'zz')).toThrow(TypeError)
    })

    test('hexColorToInt parses a hex colour, stripping the leading #', () => {
        expect(Utils.hexColorToInt('#FFFFFF')).toBe(0xFFFFFF)
        expect(Utils.hexColorToInt('#000000')).toBe(0)
        expect(Utils.hexColorToInt('#0000FF')).toBe(0x0000FF)
    })

    test('hexColorToInt honours a custom prefix', () => {
        // The # is replaced by the prefix before parsing.
        expect(Utils.hexColorToInt('#FF', 'FF')).toBe(0xFFFF)
    })

    test('rgba2abgr reverses the four byte components', () => {
        expect(Utils.rgba2abgr('AABBCCDD')).toBe('DDCCBBAA')
    })

    test('rgba2abgr throws on an empty string', () => {
        expect(() => Utils.rgba2abgr('')).toThrow(TypeError)
    })

    test('hexToArray splits a hex string into byte pairs', () => {
        expect(Utils.hexToArray('AABBCC')).toEqual(['AA', 'BB', 'CC'])
        expect(Utils.hexToArray('')).toEqual([])
    })
})

describe('Utils.loadImagesOrdered', () => {

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    test('fetches each url and resolves to decoded bitmaps in order', async () => {
        const fetchMock = vi.fn((url: string) =>
            Promise.resolve({blob: () => Promise.resolve(`blob:${url}`)})
        )
        const bitmapMock = vi.fn((blob: string) => Promise.resolve(`bitmap:${blob}`))

        vi.stubGlobal('fetch', fetchMock)
        vi.stubGlobal('createImageBitmap', bitmapMock)

        const result = await Utils.loadImagesOrdered(['a', 'b'])

        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(result).toEqual(['bitmap:blob:a', 'bitmap:blob:b'])
    })

    test('loadImagesOrderedAsync resolves to decoded bitmaps', async () => {
        const fetchMock = vi.fn((url: string) =>
            Promise.resolve({blob: () => Promise.resolve(`blob:${url}`)})
        )
        const bitmapMock = vi.fn((blob: string) => Promise.resolve(`bitmap:${blob}`))

        vi.stubGlobal('fetch', fetchMock)
        vi.stubGlobal('createImageBitmap', bitmapMock)

        const result = await Utils.loadImagesOrderedAsync(['x'])

        expect(result).toEqual(['bitmap:blob:x'])
    })
})
