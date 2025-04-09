module.exports = {
    testEnvironment: 'jsdom',
    setupFiles: ['./readease/test/setup.js'],
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    moduleFileExtensions: ['js', 'json'],
    testMatch: ['**/public/**/*test.js', '**/public/**/*spec.js'],
    transformIgnorePatterns: [
        'node_modules/(?!(jest-fetch-mock|text-readability)/)'
    ],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    }
};