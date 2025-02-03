export default {
    testEnvironment: 'jsdom', // Use jsdom for testing
    setupFiles: ['./public/setup.js'],
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    moduleFileExtensions: ['js', 'json'],
    testMatch: ['**/public/**/test.js', '**/public/**/spec.js']
};