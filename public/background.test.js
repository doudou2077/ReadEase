// Test file for background.js functions
import { updateSimplificationLevel } from './background.js';

// Mock Chrome API
global.chrome = {
  storage: {
    local: {
      set: jest.fn((data, callback) => {
        console.log('Mock chrome.storage.local.set called with:', data);
        if (callback) callback();
      })
    }
  }
};

// Mock console
global.console = {
  log: jest.fn(),
  error: jest.fn()
};

describe('Background Script Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('updateSimplificationLevel should call chrome.storage.local.set with correct parameters', () => {
    // Call the function with a test level
    updateSimplificationLevel(3);
    
    // Check if chrome.storage.local.set was called with the correct parameters
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      { simplificationLevel: 3 },
      expect.any(Function)
    );
    
    // Check if console.log was called with the correct message
    expect(console.log).toHaveBeenCalledWith('Simplification level set to:', 3);
  });
}); 