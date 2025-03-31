import { GRADE_LEVELS } from './gradeConfig';
import { createSettingsModal, addMessage, loadChatHistory, saveChatHistory } from '../sidepanel.ts'; 

describe('Sidepanel Tests', () => {
  let chatContainer;

  beforeEach(() => {
    // Set up the DOM for testing
    document.body.innerHTML = `
      <div id="chat-container"></div>
      <textarea id="message-input"></textarea>
      <button id="send-button">Send</button>
    `;
    chatContainer = document.getElementById('chat-container');
    localStorage.clear(); // Clear local storage before each test
  });

  test('loadChatHistory loads messages from localStorage', () => {
    const messages = '<div class="message assistant-message">Hello</div>';
    localStorage.setItem('chatHistory', messages);
    
    loadChatHistory();
    
    expect(chatContainer.innerHTML).toBe(messages);
  });

  test('saveChatHistory saves messages to localStorage', () => {
    const message = '<div class="message user-message">Test message</div>';
    chatContainer.innerHTML = message;
    
    saveChatHistory();
    
    expect(localStorage.getItem('chatHistory')).toBe(message);
  });

  test('addMessage adds a new message to the chat', () => {
    addMessage('Hello, world!', false, GRADE_LEVELS.ELEMENTARY);
    
    expect(chatContainer.children.length).toBe(1);
    expect(chatContainer.children[0].textContent).toContain('Hello, world!');
  });

  test('addMessage applies the correct font size', (done) => {
    // Mock chrome.storage.local.get
    chrome.storage.local.get = jest.fn((keys, callback) => {
      callback({ fontSize: 20 });
    });

    addMessage('Test message', false, GRADE_LEVELS.ELEMENTARY);
    
    setTimeout(() => {
      expect(chatContainer.children[0].style.fontSize).toBe('20px');
      done();
    }, 0);
  });

  test('createSettingsModal creates and displays the modal', () => {
    createSettingsModal();
    
    const modal = document.getElementById('settings-modal');
    expect(modal).toBeTruthy();
    expect(modal).toContainHTML('<h3>Simplification Level</h3>');
  });

  test('confirm button updates simplification level and font size', () => {
    createSettingsModal();
    
    const select = document.querySelector('select');
    const selectFontSize = document.querySelectorAll('select')[1]; // Assuming the second select is for font size

    select.value = '3'; // Set to Medium
    selectFontSize.value = '18'; // Set font size to 18

    const confirmButton = document.querySelector('button:last-child'); // Get the confirm button
    confirmButton.click();

    // Check if the values are updated in local storage
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ simplificationLevel: 3 });
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ fontSize: 18 });
  });
});