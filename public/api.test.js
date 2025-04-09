import { generateContent } from './api';

// Mock fetch globally
global.fetch = jest.fn();

describe('generateContent', () => {
    beforeEach(() => {
        // Clear mock before each test
        fetch.mockClear();
    });

    it('should successfully generate content with just a prompt', async () => {
        // Mock successful API response
        const mockResponse = {
            candidates: [{
                content: {
                    parts: [{
                        text: 'Generated response'
                    }]
                }
            }]
        };

        fetch.mockImplementationOnce(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            })
        );

        const result = await generateContent('Test prompt');
        
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('generativelanguage.googleapis.com'),
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: expect.stringContaining('Test prompt')
            })
        );
        expect(result).toBe('Generated response');
    });

    it('should successfully generate content with prompt and text', async () => {
        const mockResponse = {
            candidates: [{
                content: {
                    parts: [{
                        text: 'Generated response with context'
                    }]
                }
            }]
        };

        fetch.mockImplementationOnce(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            })
        );

        const result = await generateContent('Test prompt', 'Additional context');
        
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('generativelanguage.googleapis.com'),
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: expect.stringContaining('Test prompt')
            })
        );
        expect(result).toBe('Generated response with context');
    });

    it('should handle rate limiting error (429)', async () => {
        fetch.mockImplementationOnce(() => 
            Promise.resolve({
                ok: false,
                status: 429,
                statusText: 'Too Many Requests'
            })
        );

        await expect(generateContent('Test prompt')).rejects.toThrow('Too many requests');
    });

    it('should handle general API errors', async () => {
        fetch.mockImplementationOnce(() => 
            Promise.resolve({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            })
        );

        await expect(generateContent('Test prompt')).rejects.toThrow('API error: 500 Internal Server Error');
    });

    it('should handle invalid API response format', async () => {
        const mockResponse = {
            candidates: [] // Empty candidates array
        };

        fetch.mockImplementationOnce(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            })
        );

        await expect(generateContent('Test prompt')).rejects.toThrow('Invalid API response format');
    });

    it('should handle network errors', async () => {
        fetch.mockImplementationOnce(() => 
            Promise.reject(new Error('Network error'))
        );

        await expect(generateContent('Test prompt')).rejects.toThrow('Network error');
    });
}); 