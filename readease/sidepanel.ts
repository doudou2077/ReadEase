const chatContainer = document.getElementById('chat-container') as HTMLDivElement;
const messageInput = document.getElementById('message-input') as HTMLTextAreaElement;
const sendButton = document.getElementById('send-button') as HTMLButtonElement;

// Load chat history from localStorage
const loadChatHistory = () => {
  const history = localStorage.getItem('chatHistory');
  if (history) {
    chatContainer.innerHTML = history;
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
  messageDiv.textContent = content;
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