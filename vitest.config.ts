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
                'src/**/index.ts',
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
