import fetchMock from 'jest-fetch-mock';
import { generateContent } from './api';

// Enable fetch mocks before each test
beforeEach(() => {
    fetchMock.enableMocks();
});

// Reset mocks after each test
afterEach(() => {
    fetchMock.resetMocks();
});

//test api.js
describe('API Status Test', () => {
    test('should return content from the API', async () => {
        // Mock the fetch response
        fetchMock.mockResponseOnce(JSON.stringify({
            candidates: [{
                content: {
                    parts: [{ text: "Generated content" }]
                }
            }]
        }));

        const prompt = "Test prompt";
        const text = "Test text";
        
        const result = await generateContent(prompt, text);
        
        expect(result).toBe("Generated content");
    });
});
