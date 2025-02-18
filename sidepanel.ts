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

//joy
// Create a fixed header
const header = document.createElement('div');
header.style.position = 'fixed';
header.style.top = '0';
header.style.left = '0';
header.style.right = '0';
header.style.padding = '10px';
header.style.backgroundColor = '#f7f7f8';
header.style.borderBottom = '1px solid #ccc';
header.style.zIndex = '1000'; // Ensure it stays above other content

// Create settings button
const settingsButton = document.createElement('button');
settingsButton.textContent = '⚙️ Settings'; 
settingsButton.style.cursor = 'pointer';
settingsButton.style.border = 'none';
settingsButton.style.background = 'none';
settingsButton.style.fontSize = '20px';

// Add click handler for settings button
settingsButton.addEventListener('click', (e) => {
    e.preventDefault();
    createSettingsModal(); // Show the settings modal
});

// Append settings button to header
header.appendChild(settingsButton);

// Append header to the document body
document.body.appendChild(header);

// Adjust chat container to account for the fixed header
chatContainer.style.paddingTop = '50px'; // Adjust based on header height

let currentLevel = ""; // Variable to store the current level

// Function to create settings modal
const createSettingsModal = () => {
    // Remove existing settings modal if it exists
    const existingSettingsModal = document.getElementById("settings-modal");
    if (existingSettingsModal) existingSettingsModal.remove();

    // Create a modal window
    const modal = document.createElement("div");
    modal.id = "settings-modal";
    modal.style.position = "fixed";
    modal.style.left = "50%";
    modal.style.top = "15%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.backgroundColor = "white";
    modal.style.border = "1px solid #ccc";
    modal.style.padding = "20px";
    modal.style.zIndex = "10000";
    modal.style.width = "230px";
    modal.style.height = "120px";
    modal.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";

    // Add content to the modal
    const title = document.createElement("h3");
    title.textContent = "Simplification Level";
    modal.appendChild(title);

    // Create a display element for the current level
    const currentLevelDisplay = document.createElement("div");
    currentLevelDisplay.textContent = `Current Level: ${currentLevel}`; // Show the latest set level
    currentLevelDisplay.style.marginBottom = "10px"; // Add margin below the display
    modal.appendChild(currentLevelDisplay);

    // Create a dropdown for simplification levels
    const select = document.createElement("select");
    const levels = ["Most Difficult", "Difficult", "Medium", "Easy", "Easiest"];
    for (let i = 0; i < levels.length; i++) {
        const option = document.createElement("option");
        option.value = (i + 1).toString(); // Set value from 1 to 5
        option.textContent = levels[i]; // Set text to the corresponding level
        select.appendChild(option);
    }
    modal.appendChild(select);

    // Add styles to align dropdown and button
    select.style.display = "inline-block"; // Make dropdown inline
    select.style.marginRight = "10px"; // Add some space between dropdown and button

    // Set the dropdown to the current level
    select.value = currentLevel.split(" ")[1];
    
    // Add a confirm button
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Confirm";
    confirmButton.style.marginLeft = "10px";
    confirmButton.style.backgroundColor = "#007AFF"; // Match with send button color
    confirmButton.style.color = "white"; // Set text color to white
    confirmButton.style.border = "none"; // Remove border
    confirmButton.style.borderRadius = "6px"; // Add border radius for rounded corners
    confirmButton.style.padding = "5px 5px"; // Add padding for better appearance
    confirmButton.style.cursor = "pointer"; // Change cursor to pointer
    // Update the current level and display when the confirm button is clicked
    confirmButton.addEventListener("click", () => {
      currentLevel = `Level ${select.value}`; // Update the current level
      currentLevelDisplay.textContent = `Current Level: ${currentLevel}`; // Update display
      modal.remove(); // Close the modal
    });
    modal.appendChild(confirmButton);

    // Append modal to document body
    document.body.appendChild(modal);
};
