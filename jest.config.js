module.exports = {
    setupFiles: ["jest-canvas-mock"],
    transform: {'^.+\\.ts?$': 'ts-jest'},
    testEnvironment: 'jsdom',
    testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    resolver: "jest-ts-webcompat-resolver"
};
