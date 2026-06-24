import {defineConfig} from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        include: ['tests/**/*.{test,spec}.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            reportsDirectory: './coverage',
            include: ['src/**/*.ts'],
            exclude: [
                'src/**/*.d.ts',
                'src/interfaces/**',
                // WebGPU compute-shader renderers: their bodies require a real GPU
                // device and cannot run under jsdom (only their init() rejection
                // paths are reachable, which DmdRenderer already covers).
                'src/renderers/change-alpha-renderer.ts',
                'src/renderers/dummy-renderer.ts',
                'src/renderers/noise-effect-renderer.ts',
                'src/renderers/outline-renderer.ts',
                'src/renderers/remove-aliasing-renderer.ts',
                'src/renderers/remove-alpha-renderer.ts',
            ],
            // Fail the run if coverage drops below these floors (set a few points
            // under the current ~90% to catch regressions without being flaky).
            thresholds: {
                statements: 88,
                branches: 78,
                functions: 87,
                lines: 88,
            },
        },
    },
})
