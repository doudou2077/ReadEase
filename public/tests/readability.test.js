import textReadability from 'text-readability';
import { getReadingLevelDescription } from '../content.js';

describe('Readability Tests', () => {
    test('should calculate grade level correctly', () => {
        const text = "This is a test sentence.";
        const gradeLevel = textReadability.fleschKincaidGrade(text);
        expect(typeof gradeLevel).toBe('number');
    });

    test('should return correct reading level description', () => {
        expect(getReadingLevelDescription(4)).toBe("Elementary School");
        expect(getReadingLevelDescription(7)).toBe("Middle School");
        expect(getReadingLevelDescription(11)).toBe("High School");
    });
});