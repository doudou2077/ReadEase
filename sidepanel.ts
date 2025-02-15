import { GRADE_LEVELS, SIMPLIFICATION_PROMPTS } from './public/gradeConfig.js';
import type { GradeLevel } from './src/types.js';



export { };
/// <reference types="chrome" />

// Notify background script that sidepanel is ready
chrome.runtime.sendMessage({ action: "sidepanel_ready" });

const chatContainer = document.getElementById('chat-container') as HTMLDivElement;
const messageInput = document.getElementById('message-input') as HTMLTextAreaElement;
const sendButton = document.getElementById('send-button') as HTMLButtonElement;

interface Message {
  target: string;
  feature: 'simplify' | 'summarize' | 'tts';
  text: string;
  response?: string;
  error?: string;
  readability?: {
    gradeLevel: number;
    readingLevel: GradeLevel;
  };
  currentLevel?: GradeLevel;
  remainingLevels?: number;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message: Message) => {
  console.log("Sidepanel received message:", {
    message,
    hasError: !!message.error,
    currentLevel: message.currentLevel,
    remainingLevels: message.remainingLevels
  });
  if (message.target === "sidepanel") {
    if (message.error) {
      console.log("Handling error case:", {
        error: message.error,
        currentLevel: message.currentLevel,
        remainingLevels: message.remainingLevels
      });

      // Create a more user-friendly error message for the simplest level case
      if (message.error === "Text is already at the simplest level") {
        addMessage(
          message.text, // Keep the original text
          false,
          GRADE_LEVELS.BELOW_KINDERGARTEN,
          true, // Force disable the button
        );
      } else {
        addMessage(`Error: ${message.error}`, false);
      }
    } else if (message.response) {
      console.log("Handling response case:", {
        currentLevel: message.currentLevel,
        remainingLevels: message.remainingLevels
      });

      addMessage(
        message.response,
        false,
        message.currentLevel || message.readability?.readingLevel,
        message.remainingLevels === 0
      );
    }
  }
});

// Load chat history from localStorage
const loadChatHistory = () => {
  const history = localStorage.getItem('chatHistory');
  if (history) {
    chatContainer.innerHTML = history;
    // Add 'latest' class to the last assistant message
    const messages = chatContainer.querySelectorAll('.assistant-message');
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      lastMessage.classList.add('latest');
    }
  }
};

// Save chat history to localStorage
const saveChatHistory = () => {
  localStorage.setItem('chatHistory', chatContainer.innerHTML);
};

// Add a new message to the chat
const addMessage = (
  content: string,
  isUser: boolean,
  currentGradeLevel?: GradeLevel,
  shouldDisable?: boolean,
  customTooltip?: string
) => {
  console.log("=== Adding New Message ===", {
    content: content.substring(0, 50) + "...",
    isUser,
    currentGradeLevel,
    shouldDisable
  });

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;

  // Store grade level in data attribute
  if (currentGradeLevel) {
    messageDiv.setAttribute('data-grade-level', currentGradeLevel);
  }

  // Create text container
  const textDiv = document.createElement('div');
  textDiv.textContent = content;
  messageDiv.appendChild(textDiv);

  // Add simplify button only for assistant messages
  if (!isUser) {
    const simplifyButton = document.createElement('button');
    simplifyButton.className = 'action-button';
    simplifyButton.innerHTML = '<span class="material-icons">auto_fix_high</span>  Say it differently';

    console.log("Button state check:", {
      currentGradeLevel,
      shouldDisable,
      isKindergartenOrBelow: currentGradeLevel === GRADE_LEVELS.BELOW_KINDERGARTEN
    });

    // Check if we should disable the button
    const isKindergartenOrBelow =
      currentGradeLevel === GRADE_LEVELS.BELOW_KINDERGARTEN ||
      shouldDisable;

    if (isKindergartenOrBelow) {
      console.log("Disabling button because:", {
        currentGradeLevel,
        shouldDisable,
        isKindergartenOrBelow
      });

      simplifyButton.disabled = true;
      simplifyButton.title = 'This text is already at the simplest level';
      simplifyButton.style.opacity = '0.6';
      simplifyButton.style.cursor = 'not-allowed';
      simplifyButton.style.backgroundColor = '#cccccc';
    } else {
      simplifyButton.title = 'Say it differently';




      // Add click handler for simplify button
      simplifyButton.addEventListener('click', () => {
        console.log("=== Simplify Button Click Debug ===");
        const currentLevel = messageDiv.getAttribute('data-grade-level');
        const textContent = textDiv.textContent || "";

        if (!currentLevel || !textContent) {
          console.error("Missing data:", { currentLevel, textContent });
          return;
        }

        // Send to background.js for API call 
        chrome.runtime.sendMessage({
          action: "simplifyText",
          text: textContent,
          currentLevel: currentLevel as GradeLevel
        }, (response) => {
          console.log("=== Response from Background ===");
          if (chrome.runtime.lastError) {
            console.error("Runtime error:", chrome.runtime.lastError);
            return;
          }
          console.log("Got response:", response);

          if (response.error) {
            // Handle the "already at simplest level" case
            if (response.error === "Text is already at the simplest level") {
              simplifyButton.disabled = true;
              simplifyButton.title = 'This text is already at the simplest level';
              simplifyButton.style.opacity = '0.6';
              simplifyButton.style.cursor = 'not-allowed';
              simplifyButton.style.backgroundColor = '#cccccc';
              messageDiv.setAttribute('data-grade-level', GRADE_LEVELS.BELOW_KINDERGARTEN);
            }
          } else if (response && response.simplifiedText) {
            console.log("Updating UI with simplified text");
            textDiv.textContent = response.simplifiedText;
            messageDiv.setAttribute('data-grade-level', response.currentLevel);
            if (response.remainingLevels === 0) {
              simplifyButton.disabled = true;
              simplifyButton.title = 'Already at simplest level';
            }
            saveChatHistory();
          } else {
            console.error("Invalid response:", response);
          }
        });


      });
    }

    console.log("Added click listener to button", {
      hasListener: simplifyButton.onclick !== null,
      button: simplifyButton
    });

    messageDiv.appendChild(simplifyButton);
  }

  // Remove 'latest' class from previous message
  const previousLatest = chatContainer.querySelector('.latest');
  if (previousLatest) {
    previousLatest.classList.remove('latest');
  }

  // Add latest class to new message
  messageDiv.classList.add('latest');

  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  saveChatHistory();
};

// Handle sending messages
const handleSend = () => {
  const message = messageInput.value.trim();
  if (message) {
    addMessage(message, true);
    messageInput.value = '';

    // Simulate assistant response (replace with actual AI integration)
    setTimeout(() => {
      addMessage("I'm a demo assistant. Real AI responses will be implemented soon!", false);
    }, 1000);
  }
};

// Event listeners
sendButton.addEventListener('click', handleSend);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// Auto-resize textarea
messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = messageInput.scrollHeight + 'px';
});

// Load chat history on startup
loadChatHistory();