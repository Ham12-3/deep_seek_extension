# DeepCoder Assistant

DeepCoder is your intelligent coding companion, seamlessly integrated into VS Code and Cursor. Powered by advanced AI, it provides real-time code suggestions, debugging help, and instant answers to your programming questions—all without leaving your editor. Whether you're writing a new feature, debugging complex logic, or learning a new framework, DeepCoder Assistant is here to supercharge your productivity.

## Features

- **Real-time Code Suggestions**: Get instant code suggestions as you type.
- **Debugging Help**: Receive assistance with debugging complex logic.
- **Instant Answers**: Ask programming questions and get immediate responses.
- **Seamless Integration**: Works directly within VS Code and Cursor.
- **Chat Interface**: Interact with the AI assistant through a sleek chat interface.
- **Secure API Key Handling**: Prompts for the API key every time for secure usage.

## Requirements

- Visual Studio Code version 1.96.0 or higher.
- An active internet connection for AI features.
- Deepseek API key.

## Extension Settings

This extension contributes the following settings:

- `aiAssistant.model`: The AI model to use (default: `deepseek`).

## Known Issues

- List any known issues here.

## Release Notes

### 1.0.3

- Added a sleek chat interface with real-time code suggestions and debugging help.
- Improved error handling and user-friendly messages.
- Enhanced UI to match VS Code themes and responsive design.

### 1.0.0

- Initial release of DeepCoder Assistant.

## License

This project is licensed under the MIT License.

## Installation

1. Install the extension from the Visual Studio Marketplace or by using the `.vsix` file.

## Usage

1. **Install the Extension**:

   - Install the extension from the Visual Studio Marketplace or by using the `.vsix` file.

2. **Enter Your API Key**:

   - When prompted, enter your Deepseek API key. This key is required to use the AI features.

3. **Start the Chat**:

   - Open the command palette (`Ctrl+Shift+P`).
   - Type `DeepCoder: Open Chat` and press Enter to open the chat interface.

4. **Interact with the AI Assistant**:

   - Type your message in the input box at the bottom of the chat interface.
   - Press Enter or click the Send button to send your message.
   - The AI assistant will respond with code suggestions, debugging help, or answers to your programming questions.

5. **View Responses**:
   - The responses from the AI assistant will appear in the chat window.
   - Code suggestions and answers will be formatted for easy reading.

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- `Ctrl+Space` (Windows, Linux Ctrl+Space) to trigger the Suggestions widget.
- `Ctrl+Shift+V` (Windows, Linux Ctrl+Shift+V) to view the Markdown preview.
- `Ctrl+K V` (Windows, Linux Ctrl+K V) to open the preview to the side.
