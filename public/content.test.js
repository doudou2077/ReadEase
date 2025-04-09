import { jest } from '@jest/globals';
import { getReadingLevelDescription } from './content.js';

// Mock the text-readability module
jest.mock('text-readability', () => ({
  fleschKincaidGrade: jest.fn()
}));

// Mock the tts module
jest.mock('./tts.js', () => ({
  textToSpeech: jest.fn()
}));

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    lastError: null
  },
  storage: {
    local: {
      set: jest.fn()
    }
  }
};

// Mock document and window
document.createElement = jest.fn().mockImplementation((tagName) => {
  const element = {
    id: '',
    style: {},
    textContent: '',
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn().mockReturnValue(false)
  };
  return element;
});

document.getElementById = jest.fn().mockImplementation((id) => {
  if (id === 'readease-modal') {
    return {
      remove: jest.fn(),
      contains: jest.fn().mockReturnValue(false)
    };
  }
  if (id === 'hover-icon') {
    return {
      remove: jest.fn(),
      contains: jest.fn().mockReturnValue(false)
    };
  }
  return null;
});

// Create a proper mock for document.body
const bodyElement = document.createElement('body');
bodyElement.appendChild = jest.fn();
Object.defineProperty(document, 'body', {
  value: bodyElement,
  writable: true
});

// Create a proper mock for document.head
const headElement = document.createElement('head');
headElement.appendChild = jest.fn();
Object.defineProperty(document, 'head', {
  value: headElement,
  writable: true
});

document.createTextNode = jest.fn().mockReturnValue({});

window.getSelection = jest.fn().mockReturnValue({
  toString: jest.fn().mockReturnValue('')
});

window.location = {
  href: 'https://example.com'
};

// Mock alert
global.alert = jest.fn();

describe('ReadEase Content Script', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Reset the lastSelectedText variable
    global.lastSelectedText = '';
  });

  describe('getReadingLevelDescription', () => {
    test('should return "Below Kindergarten (K)" for grade level < 0', () => {
      expect(getReadingLevelDescription(-1)).toBe('Below Kindergarten (K)');
    });

    test('should return "Elementary (1-5)" for grade level between 0 and 5', () => {
      expect(getReadingLevelDescription(0)).toBe('Elementary (1-5)');
      expect(getReadingLevelDescription(3)).toBe('Elementary (1-5)');
      expect(getReadingLevelDescription(5)).toBe('Elementary (1-5)');
    });

    test('should return "Middle School (6-8)" for grade level between 6 and 8', () => {
      expect(getReadingLevelDescription(6)).toBe('Middle School (6-8)');
      expect(getReadingLevelDescription(7)).toBe('Middle School (6-8)');
      expect(getReadingLevelDescription(8)).toBe('Middle School (6-8)');
    });

    test('should return "High School (9-12)" for grade level between 9 and 12', () => {
      expect(getReadingLevelDescription(9)).toBe('High School (9-12)');
      expect(getReadingLevelDescription(10)).toBe('High School (9-12)');
      expect(getReadingLevelDescription(12)).toBe('High School (9-12)');
    });

    test('should return "College (13-16)" for grade level between 13 and 16', () => {
      expect(getReadingLevelDescription(13)).toBe('College (13-16)');
      expect(getReadingLevelDescription(15)).toBe('College (13-16)');
      expect(getReadingLevelDescription(16)).toBe('College (13-16)');
    });

    test('should return "College Graduate (17+)" for grade level > 16', () => {
      expect(getReadingLevelDescription(17)).toBe('College Graduate (17+)');
      expect(getReadingLevelDescription(20)).toBe('College Graduate (17+)');
    });
  });
}); 