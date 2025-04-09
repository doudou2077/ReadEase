// Mock the global lastSelectedText variable
global.lastSelectedText = '';

// Mock the isTextCurrentlySelected function
global.isTextCurrentlySelected = function() {
  const selection = window.getSelection();
  const currentText = selection ? selection.toString().trim() : '';
  return currentText === global.lastSelectedText && currentText.length > 0;
};

// Mock the createModal function
global.createModal = function(selectedText) {
  const modal = document.createElement('div');
  modal.id = 'readease-modal';
  return modal;
};

// Mock the createFloatingButton function
global.createFloatingButton = function() {
  const button = document.createElement('button');
  button.textContent = 'Simplify';
  button.style.display = 'none';
  return button;
};

// Mock the createHoverIcon function
global.createHoverIcon = function() {
  const hoverIcon = document.createElement('div');
  hoverIcon.id = 'hover-icon';
  hoverIcon.textContent = 'R';
  return hoverIcon;
};

// Mock the addLoadingToButton function
global.addLoadingToButton = function(button) {
  const originalText = button.textContent;
  button.textContent = '';
  return function() {
    button.textContent = originalText;
  };
}; 