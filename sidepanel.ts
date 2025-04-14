import { GRADE_LEVELS, SIMPLIFICATION_PROMPTS } from './public/gradeConfig.js';
import type { GradeLevel } from './src/types.js';

// export { };
/// <reference types="chrome" />

const HIDE_SETTINGS_PROMPT_KEY = 'hideSettingsPrompt';

const style = document.createElement('style');
style.textContent = `
  .loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-message {
    display: flex;
    align-items: center;
    padding: 10px;
    color: #666;
  }
`;
document.head.appendChild(style);

// create a loading message
// Update the addLoadingMessage function to accept a feature parameter
const addLoadingMessage = (feature = 'simplify') => {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message assistant-message loading-message';

  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';

  // Add different colors based on feature
  if (feature === 'summarize') {
    spinner.style.borderTop = '3px solid #3498db';
  } else if (feature === 'simplify') {
    spinner.style.borderTop = '3px solid #3498db';
  } else if (feature === 'tts') {
    spinner.style.borderTop = '3px solid #3498db';
  }

  const text = document.createElement('span');
  text.textContent = feature === 'summarize'
    ? 'Summarizing your content...'
    : feature === 'tts'
      ? 'Preparing audio...'
      : 'Processing your request...';

  messageDiv.appendChild(spinner);
  messageDiv.appendChild(text);
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  return messageDiv;
};

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
  type?: string;
  //fontSize: number 
  action?: string;
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
  console.log("Sidepanel received message:", message);

  if (message.action === "showLoading") {
    console.log("LOADING MESSAGE RECEIVED with feature:", message.feature);
    addLoadingMessage(message.feature);
    return;
  }

  // Only handle messages targeted to sidepanel
  if (message.target === "sidepanel") {
    // Remove any loading messages
    const loadingMessages = document.querySelectorAll('.loading-message');
    loadingMessages.forEach(msg => msg.remove());

    if (message.error) {
      // Handle error case
      if (message.error === "Text is already at the simplest level") {
        addMessage(
          message.text,
          false,
          GRADE_LEVELS.BELOW_KINDERGARTEN,
          true,
        );
      } else {
        addMessage(`Error: ${message.error}`, false);
      }
    } else if (message.response) {
      if (message.feature === "summarize" && message.action === "updateWithReadability") {
        // Handle the readability update for summarization
        console.log("Displaying summary with readability:", message.response);

        const displayResponse = message.type === "url"
          ? `**Summary of <a href="${message.text}" target="_blank">${getDomainName(message.text)}</a>**\n\n${message.response}`
          : `**Summary**\n\n${message.response}`;

        // Set a default grade level for summaries if readability is not available
        const gradeLevel = message.readability?.readingLevel || GRADE_LEVELS.COLLEGE_GRADUATE;
        
        addMessage(
          displayResponse,
          false,
          gradeLevel,
          false // Not at simplest level yet
        );
      } else if (message.feature === "summarize") {
        console.log("Displaying summary:", message.response);

        const displayResponse = message.type === "url"
          ? `**Summary of <a href="${message.text}" target="_blank">${getDomainName(message.text)}</a>**\n\n${message.response}`
          : `**Summary**\n\n${message.response}`;

        // Set a default grade level for summaries if readability is not available
        const gradeLevel = message.readability?.readingLevel || GRADE_LEVELS.COLLEGE_GRADUATE;

        addMessage(
          displayResponse,
          false,
          gradeLevel,
          false // Not at simplest level yet
        );
      }
      // For simplify feature, handle as before
      else if (message.feature === "simplify") {
        addMessage(
          message.response,
          false,
          message.currentLevel,
          message.remainingLevels === 0
        );
      }
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

  // Retrieve font size from local storage
  chrome.storage.local.get(['fontSize'], (result) => {
    const fontSize = result.fontSize || 16; // Default to 16 if not set
    messageDiv.style.fontSize = `${fontSize}px`; // Apply the font size to the message
  });

  // Store grade level in data attribute
  if (currentGradeLevel) {
    console.log("Setting grade level attribute:", currentGradeLevel);
    messageDiv.setAttribute('data-grade-level', currentGradeLevel);
  } else {
    console.warn("No grade level provided for message");
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
    simplifyButton.style.display = 'flex';
    simplifyButton.style.alignItems = 'center';
    simplifyButton.style.gap = '8px';
    simplifyButton.innerHTML = `
      <span class="material-icons simplify-icon">auto_fix_high</span>
      <span class="simplify-text">Say it differently</span>
      <span style="color: #ccc; margin: 0 4px;">|</span>
      <span class="material-icons speaker-icon" style="cursor: pointer;" title="Read aloud">volume_up</span>
    `;

    // Store the utterance for this message
    let currentUtterance: SpeechSynthesisUtterance | null = null;

    // Initialize global state if not exists
    if (!window.currentPlayingMessage) {
      window.currentPlayingMessage = null;
    }

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
      
      // Add click handler for speaker icon
      const speakerIcon = simplifyButton.querySelector('.speaker-icon');
      speakerIcon?.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent the simplify action
        const textContent = textDiv.textContent || "";
        if (textContent) {
          // Stop any currently playing speech
          if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            // Reset the icon of the previously playing message
            const previousSpeaker = window.currentPlayingMessage?.querySelector('.speaker-icon');
            if (previousSpeaker) {
              previousSpeaker.textContent = 'volume_up';
            }
          }

          // Create new utterance
          currentUtterance = new SpeechSynthesisUtterance(textContent);
          window.currentPlayingMessage = messageDiv;

          // Handle end of speech
          currentUtterance.onend = () => {
            window.currentPlayingMessage = null;
          };

          // Handle error
          currentUtterance.onerror = () => {
            window.currentPlayingMessage = null;
          };

          // Start speech
          speechSynthesis.speak(currentUtterance);
        }
      });

      // Add click handler for simplify icon and text
      const simplifyIcon = simplifyButton.querySelector('.simplify-icon');
      const simplifyText = simplifyButton.querySelector('.simplify-text');
      
      const handleSimplify = () => {
        console.log("=== Simplify Button Click Debug ===");
        const currentLevel = messageDiv.getAttribute('data-grade-level');
        const textContent = textDiv.textContent || "";

        if (!currentLevel || !textContent) {
          console.error("Missing data:", { currentLevel, textContent });
          return;
        }

        // Add loading message
        const loadingMessage = addLoadingMessage();


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
          // Remove loading message
          loadingMessage.remove();

          console.log("=== Response from Background ===");
          if (chrome.runtime.lastError) {
            console.error("Runtime error:", chrome.runtime.lastError);
            addMessage(`Error: ${chrome.runtime.lastError.message}`, false);
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


      };

      simplifyIcon?.addEventListener('click', handleSimplify);
      simplifyText?.addEventListener('click', handleSimplify);
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

// Function to update font size
const updateFontSize = (size: number) => {
  chrome.storage.local.set({ fontSize: size }, () => {
    console.log('Font size set to:', size);
    // Update all messages with the new font size
    const messages = chatContainer.querySelectorAll('.message');
    messages.forEach((messageDiv) => {
      (messageDiv as HTMLElement).style.fontSize = `${size}px`; // Apply the new font size
    });
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
  modal.style.top = "20%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.backgroundColor = "white";
  modal.style.border = "1px solid #ccc";
  //modal.style.paddingLeft = "20px";
  modal.style.zIndex = "10000";
  modal.style.width = "280px";
  modal.style.height = "280px";
  modal.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
  modal.style.borderRadius = "20px";
  modal.style.display = "flex"; // Use flexbox for centering
  modal.style.flexDirection = "column"; // Stack children vertically
  modal.style.alignItems = "center"; // Center items horizontally
  modal.style.justifyContent = "center"; // Center items vertically

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

  // Add font adjustment choices to the modal
  const fontSize = document.createElement("h3");
  fontSize.textContent = "Font Size";
  modal.appendChild(fontSize);

  // Create a dropdown for simplification levels
  const selectFontSize = document.createElement("select");
  const sizes = [
    { value: "14", label: "14" },
    { value: "16", label: "16" },
    { value: "18", label: "18" },
    { value: "20", label: "20" },
    { value: "22", label: "22" },
    { value: "24", label: "24" }
  ];

  for (const size of sizes) {
    const option = document.createElement("option");
    option.value = size.value;
    option.textContent = size.label;
    selectFontSize.appendChild(option);
  }

  // Add styles to align dropdown and button
  selectFontSize.style.display = "inline-block";
  selectFontSize.style.marginRight = "10px";
  selectFontSize.style.width = "180px"; // Make dropdown wider to fit the text

  modal.appendChild(selectFontSize);

  // Retrieve font size from local storage
  chrome.storage.local.get(['fontSize'], (result) => {
    const fontSize = result.fontSize || null;
    if (fontSize === null) {
      selectFontSize.value = "";
    } else {
      selectFontSize.value = fontSize.toString();
    }
  });

  // Add a buttons container for confirm and cancel buttons
  const buttonsContainer = document.createElement("div");
  buttonsContainer.style.display = "flex"; // Use flexbox for horizontal alignment
  buttonsContainer.style.marginTop = "10px"; // Add some margin for spacing

  // Add a cancel button
  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.style.marginLeft = "30px";
  cancelButton.style.backgroundColor = "red";
  cancelButton.style.color = "white";
  cancelButton.style.border = "none";
  cancelButton.style.borderRadius = "6px";
  cancelButton.style.padding = "5px 5px";
  cancelButton.style.cursor = "pointer";

  cancelButton.addEventListener("click", () => {
    modal.remove();
  });
  buttonsContainer.appendChild(cancelButton);

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
    const newSize = parseInt(selectFontSize.value);
    updateFontSize(newSize);
    console.log('newSize: ', newSize);
    modal.remove();
  });
  buttonsContainer.appendChild(confirmButton);

  modal.appendChild(buttonsContainer);

  // Append modal to document body
  document.body.appendChild(modal);
};

// Add type declaration for the global variable
declare global {
  interface Window {
    currentPlayingMessage: HTMLElement | null;
  }
}