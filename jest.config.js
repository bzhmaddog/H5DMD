const tsconfig = require("./tsconfig.json")
const fromPairs = pairs => pairs.reduce((res, [key, value]) => ({...res, [key]: value}), {})
const path = require('node:path')

function moduleNameMapperFromTSPaths(tsconfig) {
    return fromPairs(
        Object.entries(tsconfig.compilerOptions.paths).map(([k, [v]]) => [
            `^${k.replace(/\*/, "(.*)")}`,
            path.join(__dirname, tsconfig.compilerOptions.baseUrl || './', v.replace(/\*/, '$1')),
        ]),
    )
}

// Resolve modules path from tsconfig.json
const moduleNameMapper = moduleNameMapperFromTSPaths(tsconfig);

module.exports = {
    moduleNameMapper,
    setupFiles: ["jest-canvas-mock"],
    transform: {'^.+\\.ts?$': 'ts-jest'},
    testEnvironment: 'jsdom',
    testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    resolver: "jest-ts-webcompat-resolver"
};
