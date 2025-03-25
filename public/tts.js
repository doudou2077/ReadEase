async function textToSpeech(text) {
  // Check for browser support
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  } else {
    console.error('Text-to-speech not supported in this browser.');
  }
}

export { textToSpeech };