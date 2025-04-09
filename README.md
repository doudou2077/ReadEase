# ReadEase Browser Extension

A browser extension to help with reading comprehension by providing text simplification, summarization, and text-to-speech capabilities.

## Features

- **Text Simplification**: Simplifies complex text to make it easier to understand
- **Text Summarization**: Creates concise summaries of longer texts
- **Text-to-Speech**: Reads selected text aloud

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Running Tests

The project uses Jest for testing. To run the tests:

```
npm test
```

To run tests in watch mode (tests will re-run when files change):

```
npm run test:watch
```

To generate a coverage report:

```
npm run test:coverage
```

### Building the Extension

```
npm run build
```

## Testing

The test suite covers the following components:

- `getReadingLevelDescription`: Tests the function that determines the reading level based on grade level
- `isTextCurrentlySelected`: Tests the function that checks if text is currently selected
- `addLoadingToButton`: Tests the function that adds a loading spinner to buttons
- `createModal`: Tests the function that creates the modal with action buttons
- `createFloatingButton`: Tests the function that creates the floating button
- `createHoverIcon`: Tests the function that creates the hover icon
- Event Listeners: Tests the various event listeners for text selection, mouseup, and click events

## License

MIT



