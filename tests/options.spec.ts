import { describe, expect, test } from 'vitest'

import { Options } from '../src/utils/options'

describe('testing Options helper class', () => {
    test('Options instance should be created', () => {
        const options = new Options()
        expect(options).toBeTruthy()
    })

    test('An Options instance created from an object should contains all keys', () => {
        const baseObject = {
            key1: 'String',
            key2: 10,
            key3: true,
        }
        const options = new Options(baseObject)

        expect(options.size).toEqual(3)
        expect(options.get('key1')).toEqual('String')
        expect(options.get('key2')).toEqual(10)
        expect(options.get('key3')).toEqual(true)
    })

    test('An Options instance created from another Options instance should contains all keys', () => {
        const baseOptions = new Options({
            key1: 'String',
            key2: 10,
            key3: true,
        })

        const options = new Options(baseOptions)

        expect(options.size).toEqual(3)
        expect(options.get('key1')).toEqual('String')
        expect(options.get('key2')).toEqual(10)
        expect(options.get('key3')).toEqual(true)
    })

    test('Modifying or deleting a value in an Options instance created from another Options instance should not alter original options values', () => {
        const baseOptions = new Options({
            key1: 'String',
            key2: 10,
            key3: true,
        })

        const options = new Options(baseOptions)

        options.set('key3', false)
        options.delete('key2')

        expect(options.get('key3')).toEqual(false)
        expect(baseOptions.get('key3')).toEqual(true)
        expect(baseOptions.get('key2')).toEqual(10)
    })

    test('Modifying or deleting a value in an Options instance created from an object should not alter original object values', () => {
        const baseObject = {
            key1: 'String',
            key2: 10,
            key3: true,
        }

        const options = new Options(baseObject)

        options.set('key3', false)
        options.delete('key2')

        expect(options.get('key3')).toEqual(false)
        expect(baseObject['key3']).toEqual(true)
        expect(baseObject['key2']).toEqual(10)
    })

    test('Accessing a deleted key should return undefined', () => {
        const baseObject = {
            key1: 'Hello world',
            key2: 10,
        }

        const options = new Options(baseObject)

        options.delete('key1')

        expect(options.size).toEqual(1)
        expect(options.get('key1')).toEqual(undefined)
    })

    test('Accessing a non existing key should return undefined', () => {
        const options = new Options({
            key1: 'Hello world',
        })

        expect(options.get('key2')).toEqual(undefined)
    })

    test('Merging two options instances should return a new object and not alter the existing ones', () => {
        const options1 = new Options({
            key1: 'Hello world',
        })

        const options2 = new Options({
            key1: 'New value',
            key2: 10,
        })

        const merged = options1.merge(options2)

        expect(merged.size).toEqual(2)
        expect(merged.get('key1')).toEqual('New value')
        expect(options1.size).toEqual(1)
    })

    test('Creating an Options instance from another instance should result in two different objects', () => {
        const options1 = new Options({
            key1: 'Hello world',
        })

        const options2 = new Options(options1)

        expect(options2).not.toBe(options1)
    })

    test('Altering an Options instance created from another instance should not alter the original instance', () => {
        const options1 = new Options({
            key1: 'Hello world',
        })

        const options2 = new Options(options1)

        options2.set('key1', 'Altered value')
        options2.set('key2', 10)

        expect(options1.size).toEqual(1)
        expect(options1.get('key1')).toEqual('Hello world')
    })

    test('Creating an Options instance from a map should result in a viable Options instance', () => {
        const map = new Map()
        map.set('key1', 'Hello World')
        map.set('key2', 10)
        map.set('key3', true)
        map.set('key4', ['1', 2, 3])

        const options = new Options(map as Options)

        expect(options.size).toEqual(4)
        expect(options.get('key1')).toEqual('Hello World')
        expect(options.get('key2')).toEqual(10)
        expect(options.get('key3')).toEqual(true)
        expect(options.get('key4')).toEqual(['1', 2, 3])
    })

    test('Merging with no argument should return a copy of the current instance', () => {
        const options = new Options({
            key1: 'Hello world',
            key2: 10,
        })

        const merged = options.merge()

        expect(merged).not.toBe(options)
        expect(merged.size).toEqual(2)
        expect(merged.get('key1')).toEqual('Hello world')
        expect(merged.get('key2')).toEqual(10)
    })

    test('Merging a plain object should return a new instance and not alter the original', () => {
        const options = new Options({
            key1: 'Hello world',
        })

        const merged = options.merge({
            key1: 'New value',
            key2: 10,
        })

        expect(merged).not.toBe(options)
        expect(merged.size).toEqual(2)
        expect(merged.get('key1')).toEqual('New value')
        expect(merged.get('key2')).toEqual(10)
        expect(options.size).toEqual(1)
        expect(options.get('key1')).toEqual('Hello world')
    })

    test('Merging a Map should return a new instance with all keys', () => {
        const options = new Options({
            key1: 'Hello world',
        })

        const map = new Map()
        map.set('key2', 10)
        map.set('key3', true)

        const merged = options.merge(map as Options)

        expect(merged).not.toBe(options)
        expect(merged.size).toEqual(3)
        expect(merged.get('key1')).toEqual('Hello world')
        expect(merged.get('key2')).toEqual(10)
        expect(merged.get('key3')).toEqual(true)
    })

    test('Merging should retain pre-existing keys that are absent from the argument', () => {
        const options = new Options({
            key1: 'Hello world',
            key2: 10,
        })

        const merged = options.merge({
            key3: true,
        })

        expect(merged.size).toEqual(3)
        expect(merged.get('key1')).toEqual('Hello world')
        expect(merged.get('key2')).toEqual(10)
        expect(merged.get('key3')).toEqual(true)
    })

    test('Constructing from an object copies array values instead of sharing the reference', () => {
        const renderers = ['a']
        const options = new Options({ renderers })

        renderers.push('b')

        expect(options.get('renderers')).toEqual(['a'])
    })

    test('Merging with no argument does not share array references with the source', () => {
        const source = new Options({ renderers: ['a'] })
        const merged = source.merge()

        ;(source.get('renderers') as string[]).push('b')

        expect(merged.get('renderers')).toEqual(['a'])
    })
})
