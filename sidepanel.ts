import { GRADE_LEVELS, SIMPLIFICATION_PROMPTS } from './public/gradeConfig.js';
import type { GradeLevel } from './src/types.js';

// export { };
/// <reference types="chrome" />

const HIDE_SETTINGS_PROMPT_KEY = 'hideSettingsPrompt';

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
  type?: string; // Add the 'type' property
}

// Add this function before the message listener
const getDomainName = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
};

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
        remainingLevels: message.remainingLevels,
        type: message.type
      });

      // If it's a URL summary, add a prefix to the response with bold title and hyperlink
      const displayResponse = message.feature === "summarize" && message.type === "url" 
        ? `**Summary of <a href="${message.text}" target="_blank">${getDomainName(message.text)}</a>**\n\n${message.response}`
        : message.feature === "summarize"
          ? `**Summary**\n\n${message.response}`
          : message.response;

      addMessage(
        displayResponse,
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
  // Convert markdown-style titles and bold text to HTML
  const formattedContent = content
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  textDiv.innerHTML = formattedContent;
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
      })
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

        chrome.storage.local.get([HIDE_SETTINGS_PROMPT_KEY], (result) => {
          if (!result[HIDE_SETTINGS_PROMPT_KEY]) {
            // Create settings prompt if it doesn't exist
            const existingPrompt = messageDiv.querySelector('.settings-prompt');
            if (!existingPrompt) {
              const settingsPrompt = document.createElement('div');
              settingsPrompt.className = 'settings-prompt';
              settingsPrompt.style.marginTop = '8px';
              settingsPrompt.style.padding = '8px';
              settingsPrompt.style.backgroundColor = '#f0f0f0';
              settingsPrompt.style.borderRadius = '4px';
              settingsPrompt.style.fontSize = '12px';
              settingsPrompt.style.display = 'flex';
              settingsPrompt.style.flexDirection = 'column';
              settingsPrompt.style.gap = '8px';

              // Top row with text and close button
              const topRow = document.createElement('div');
              topRow.style.display = 'flex';
              topRow.style.justifyContent = 'space-between';
              topRow.style.alignItems = 'center';

              const promptContent = document.createElement('div');
              promptContent.innerHTML = 'Want to set your preferred simplification level? <a style="color: #007AFF; cursor: pointer; text-decoration: underline;">Set preferred level</a>';

              const closeButton = document.createElement('button');
              closeButton.innerHTML = '×';
              closeButton.style.border = 'none';
              closeButton.style.background = 'none';
              closeButton.style.cursor = 'pointer';
              closeButton.style.fontSize = '16px';
              closeButton.style.padding = '0 4px';

              topRow.appendChild(promptContent);
              topRow.appendChild(closeButton);
              settingsPrompt.appendChild(topRow);

              // Add checkbox row
              const checkboxContainer = document.createElement('div');
              checkboxContainer.style.display = 'flex';
              checkboxContainer.style.alignItems = 'center';
              checkboxContainer.style.gap = '4px';
              checkboxContainer.style.fontSize = '11px';
              checkboxContainer.style.color = '#666';

              const checkbox = document.createElement('input');
              checkbox.type = 'checkbox';
              checkbox.id = 'dontShowAgain';

              const label = document.createElement('label');
              label.htmlFor = 'dontShowAgain';
              label.textContent = "Don't show this again";

              checkboxContainer.appendChild(checkbox);
              checkboxContainer.appendChild(label);
              settingsPrompt.appendChild(checkboxContainer);

              // Add buttons container
              const buttonsContainer = document.createElement('div');
              buttonsContainer.style.display = 'flex';
              buttonsContainer.style.justifyContent = 'flex-end';
              buttonsContainer.style.marginTop = '8px';
              buttonsContainer.style.gap = '8px';

              // Add confirm button
              const confirmButton = document.createElement('button');
              confirmButton.textContent = 'Confirm';
              confirmButton.style.backgroundColor = '#007AFF';
              confirmButton.style.color = 'white';
              confirmButton.style.border = 'none';
              confirmButton.style.borderRadius = '4px';
              confirmButton.style.padding = '4px 8px';
              confirmButton.style.cursor = 'pointer';
              confirmButton.style.fontSize = '10px';

              // Add click handlers
              const settingsLink = promptContent.querySelector('a');
              settingsLink?.addEventListener('click', () => {
                createSettingsModal();
                settingsPrompt.remove();
              });

              closeButton.addEventListener('click', () => {
                settingsPrompt.remove();
              });

              confirmButton.addEventListener('click', () => {
                if (checkbox.checked) {
                  chrome.storage.local.set({ [HIDE_SETTINGS_PROMPT_KEY]: true }, () => {
                    console.log('Settings prompt preference saved');
                  });
                }
                settingsPrompt.remove();
              });

              buttonsContainer.appendChild(confirmButton);
              settingsPrompt.appendChild(buttonsContainer);
              messageDiv.appendChild(settingsPrompt);
            }
          }
        });


        // Send to background.js for API call 
        chrome.runtime.sendMessage({
          action: "simplifyFurther",
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

//let currentLevel = ""; // Variable to store the current level
// Function to update simplification level
const updateSimplificationLevel = (level: number) => {
  chrome.storage.local.set({ simplificationLevel: level }, () => {
    console.log('Simplification level set to:', level);
  });
};

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
  modal.style.width = "280px";
  modal.style.height = "160px";
  modal.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";

  // Add content to the modal
  const title = document.createElement("h3");
  title.textContent = "Simplification Level";
  modal.appendChild(title);

  // Create a display element for the current text level
  const currentTextLevel = document.createElement("div");
  currentTextLevel.style.marginBottom = "15px";
  currentTextLevel.style.fontSize = "12px";
  currentTextLevel.style.color = "#666";

  // Get the current text's level from the latest message
  const latestMessage = document.querySelector('.assistant-message[data-grade-level]');
  const currentLevel = latestMessage?.getAttribute('data-grade-level');
  // Convert grade level to difficulty label
  let displayLevel = 'Not available';
  switch (currentLevel) {
    case GRADE_LEVELS.COLLEGE_GRADUATE:
      displayLevel = "Most Difficult";
      break;
    case GRADE_LEVELS.COLLEGE:
      displayLevel = "Difficult";
      break;
    case GRADE_LEVELS.MIDDLE_SCHOOL:
      displayLevel = "Medium";
      break;
    case GRADE_LEVELS.ELEMENTARY:
      displayLevel = "Easy";
      break;
    case GRADE_LEVELS.BELOW_KINDERGARTEN:
      displayLevel = "Easiest";
      break;
  }
  currentTextLevel.textContent = `Current text level: ${displayLevel}`;
  modal.appendChild(currentTextLevel);

  // Create a display element for the preferred level setting
  const simplificationLevelDisplay = document.createElement("div");
  simplificationLevelDisplay.textContent = `Your preferred level:`;
  simplificationLevelDisplay.style.marginBottom = "10px";
  modal.appendChild(simplificationLevelDisplay);

  // Create a dropdown for simplification levels
  const select = document.createElement("select");
  const levels = [
    { value: "1", label: "Most Difficult" },
    { value: "2", label: "Difficult" },
    { value: "3", label: "Medium" },
    { value: "4", label: "Easy" },
    { value: "5", label: "Easiest" }
  ];

  for (const level of levels) {
    const option = document.createElement("option");
    option.value = level.value;
    option.textContent = level.label;
    select.appendChild(option);
  }

  // Add styles to align dropdown and button
  select.style.display = "inline-block";
  select.style.marginRight = "10px";
  select.style.width = "180px"; // Make dropdown wider to fit the text

  modal.appendChild(select);

  // Retrieve simplificationLevel from local storage
  chrome.storage.local.get(['simplificationLevel'], (result) => {
    const simplificationLevel = result.simplificationLevel || null;
    if (simplificationLevel === null) {
      select.value = "";
    } else {
      select.value = simplificationLevel.toString();
    }
  });

  // Add a confirm button
  const confirmButton = document.createElement("button");
  confirmButton.textContent = "Confirm";
  confirmButton.style.marginLeft = "10px";
  confirmButton.style.backgroundColor = "#007AFF";
  confirmButton.style.color = "white";
  confirmButton.style.border = "none";
  confirmButton.style.borderRadius = "6px";
  confirmButton.style.padding = "5px 5px";
  confirmButton.style.cursor = "pointer";

  confirmButton.addEventListener("click", () => {
    const newLevel = parseInt(select.value);
    updateSimplificationLevel(newLevel);
    console.log('simplificationLevel: ', newLevel);
    modal.remove();
  });
  modal.appendChild(confirmButton);

  // Append modal to document body
  document.body.appendChild(modal);
};