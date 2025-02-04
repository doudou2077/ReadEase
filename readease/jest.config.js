export default {
    transform: {
        '^.+\\.jsx?$': 'babel-jest', // Use Babel to transform JavaScript files
    },
    testEnvironment: 'jsdom', // Set the test environment
};