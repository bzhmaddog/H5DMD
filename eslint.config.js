import js from '@eslint/js'
import globals from 'globals'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
    { ignores: ['**/dist/**', '**/docs/**'] },
    js.configs.recommended,
    tsPlugin.configs['flat/eslint-recommended'],
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            globals: {
                ...globals.browser,
                GPUBufferUsage: 'readonly',
                GPUTextureUsage: 'readonly',
                GPUShaderStage: 'readonly',
                GPUMapMode: 'readonly',
                GPUColorWrite: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
        },
    },
    {
        files: ['scripts/**/*.mjs'],
        languageOptions: {
            globals: globals.node,
        },
    },
    {
        files: ['**/vite.config.js'],
        languageOptions: {
            globals: globals.node,
        },
    },
]
