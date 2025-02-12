export {}; 
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
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message: Message) => {
  console.log("Sidepanel received message:", message);
  if (message.target === "sidepanel") {
    if (message.error) {
      addMessage(`Error: ${message.error}`, false);
    } else if (message.response) {
      addMessage(message.response, false);
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
const addMessage = (content: string, isUser: boolean) => {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
  
  // Create text container
  const textDiv = document.createElement('div');
  textDiv.textContent = content;
  messageDiv.appendChild(textDiv);

  // Add simplify button only for assistant messages
  if (!isUser) {
    const simplifyButton = document.createElement('button');
    simplifyButton.className = 'action-button';
    simplifyButton.innerHTML = '<span class="material-icons">auto_fix_high</span> Simpler';
    simplifyButton.title = 'Simplify';
    
    // Add click handler for simplify button
    simplifyButton.addEventListener('click', async () => {
      chrome.runtime.sendMessage({
        action: "simplifyText",
        text: textDiv.textContent || ""
      }, (response) => {
        if (response && response.simplifiedText) {
          textDiv.textContent = response.simplifiedText;
          saveChatHistory();
        }
      });
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
    modal.style.top = "12%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.backgroundColor = "white";
    modal.style.border = "1px solid #ccc";
    modal.style.padding = "20px";
    modal.style.zIndex = "10000";
    modal.style.width = "200px";
    modal.style.height = "80px";
    modal.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";

    // Add content to the modal
    const title = document.createElement("h3");
    title.textContent = "Simplification Level";
    modal.appendChild(title);

    // Create a dropdown for simplification levels
    const select = document.createElement("select");
    for (let i = 1; i <= 6; i++) {
        const option = document.createElement("option");
        option.value = i.toString();
        option.textContent = `Level ${i}`;
        select.appendChild(option);
    }
    modal.appendChild(select);

    // Add a confirm button
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Confirm";
    confirmButton.style.marginLeft = "20px";
    confirmButton.style.backgroundColor = "#007AFF"; // Match with send button color
    confirmButton.style.color = "white"; // Set text color to white
    confirmButton.style.border = "none"; // Remove border
    confirmButton.style.borderRadius = "6px"; // Add border radius for rounded corners
    confirmButton.style.padding = "5px 5px"; // Add padding for better appearance
    confirmButton.style.cursor = "pointer"; // Change cursor to pointer
    confirmButton.addEventListener("click", () => {
        modal.remove();
    });
    modal.appendChild(confirmButton);

    // Append modal to document body
    document.body.appendChild(modal);
};
