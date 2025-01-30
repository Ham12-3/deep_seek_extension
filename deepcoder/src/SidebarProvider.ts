import * as vscode from "vscode";
import axios from "axios";

export class SidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private context: vscode.ExtensionContext;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this.context = context;
  }

  public async resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    // Automatically open the chat interface
    await this.openChat(webviewView);
  }

  public async openChat(webviewView: vscode.WebviewView) {
    // Prompt for API key every time
    const apiKey = await vscode.window.showInputBox({
      prompt: "Enter your Deepseek API key",
      password: true,
    });
    if (!apiKey) {
      vscode.window.showErrorMessage("API key is required to use the chat.");
      return; // Exit if no API key is provided
    }

    // Set up the chat interface
    webviewView.webview.html = this.getHtmlForWebview(
      webviewView.webview,
      apiKey
    );

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "sendMessage":
          const response = await this.callAIApi(data.text, apiKey);
          webviewView.webview.postMessage({ type: "response", text: response });
          break;
      }
    });
  }

  public async callAIApi(userInput: string, apiKey: string): Promise<string> {
    const config = {
      method: "post",
      url: "https://api.deepseek.com/chat/completions",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      data: {
        messages: [{ role: "user", content: userInput }],
        model: "deepseek-chat",
        max_tokens: 2048,
        temperature: 1,
      },
    };

    try {
      const response = await axios(config);
      return response.data.choices[0].message.content; // Adjust based on your API response structure
    } catch (error) {
      console.error("API call error:", error);
      return "Error calling the API. Please try again."; // User-friendly error message
    }
  }

  public getHtmlForWebview(webview: vscode.Webview, apiKey: string) {
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DeepCoder Chat</title>
            <style>
                body {
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }
                #chatContainer {
                    display: flex;
                    flex-direction: column;
                    flex-grow: 1;
                    overflow: hidden;
                    border: 0.5px solid var(--vscode-editor-foreground);
                    border-radius: 5px;
                    margin: 10px;
                    max-width: 500px;
                    margin-left: auto;
                    margin-right: auto;
                }
                #chatWindow {
                    flex-grow: 1;
                    overflow-y: auto;
                    padding: 10px;
                    background-color: var(--vscode-editor-background);
                }
                .message {
                    margin: 10px 0;
                    padding: 10px;
                    border-radius: 5px;
                    max-width: 60%;
                    word-wrap: break-word;
                    white-space: pre-wrap;
                }
                .message.user {
                    background-color: var(--vscode-editor-selectionBackground);
                    align-self: flex-end;
                }
                .message.bot {
                    background-color: var(--vscode-editor-background);
                    border: 0.5px solid var(--vscode-editor-foreground);
                    align-self: flex-start;
                }
                #inputContainer {
                    display: flex;
                    padding: 10px;
                    background-color: var(--vscode-editor-background);
                    border-top: 0.5px solid var(--vscode-editor-foreground);
                }
                #userInput {
                    flex-grow: 1;
                    padding: 10px;
                    border: 0.5px solid var(--vscode-editor-foreground);
                    border-radius: 5px;
                    margin-right: 10px;
                    font-size: 16px;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                #sendButton {
                    background-color: var(--vscode-button-background);
                    border: none;
                    border-radius: 5px;
                    padding: 0 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: var(--vscode-button-foreground);
                    font-size: 16px;
                }
                #loading {
                    display: none;
                    font-size: 14px;
                    color: var(--vscode-editor-foreground);
                    text-align: center;
                    margin-top: 10px;
                }
                @media (max-width: 600px) {
                    .message {
                        max-width: 80%;
                    }
                    #userInput {
                        font-size: 14px;
                    }
                    #sendButton {
                        font-size: 14px;
                        padding: 0 8px;
                    }
                }
            </style>
        </head>
        <body>
            <div id="chatContainer">
                <div id="chatWindow"></div>
                <div id="loading" class="thinking">Thinking...</div>
                <div id="inputContainer">
                    <input type="text" id="userInput" placeholder="Type your message..." />
                    <button id="sendButton">Send</button>
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                const sendButton = document.getElementById('sendButton');
                const userInput = document.getElementById('userInput');

                sendButton.onclick = async () => {
                    const message = userInput.value;
                    if (message) {
                        document.getElementById('loading').style.display = 'block'; // Show loading indicator
                        vscode.postMessage({ type: 'sendMessage', text: message, apiKey: '${apiKey}' });
                        userInput.value = '';
                        addMessageToChatWindow(message, 'user');
                    }
                };

                userInput.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        sendButton.click();
                        event.preventDefault(); // Prevent the default action (form submission)
                    }
                });

                window.addEventListener('message', event => {
                    const message = event.data; // The JSON data our extension sent
                    if (message.type === 'response') {
                        addMessageToChatWindow(message.text, 'bot');
                        document.getElementById('loading').style.display = 'none'; // Hide loading indicator
                    } else if (message.type === 'error') {
                        addMessageToChatWindow("The server is busy at the moment. Please try again later.", 'bot');
                        document.getElementById('loading').style.display = 'none'; // Hide loading indicator
                    }
                });

                function addMessageToChatWindow(text, sender) {
                    const chatWindow = document.getElementById('chatWindow');
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message ' + sender;
                    messageDiv.textContent = text;
                    chatWindow.appendChild(messageDiv);
                    chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
                }
            </script>
        </body>
        </html>`;
  }
}
