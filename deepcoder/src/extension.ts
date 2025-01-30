// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import axios from "axios";
import { SidebarProvider } from "./SidebarProvider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "deepcoder.sidebar",
      sidebarProvider
    )
  );

  // Register the command to open the chat
  let disposable = vscode.commands.registerCommand(
    "ai-assistant.openChat",
    async () => {
      const webviewView = await vscode.window.createWebviewPanel(
        "deepcoderChat",
        "DeepCoder Chat",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

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
      webviewView.webview.html = sidebarProvider.getHtmlForWebview(
        webviewView.webview,
        apiKey
      );

      // Handle messages from the webview
      webviewView.webview.onDidReceiveMessage(async (data) => {
        switch (data.type) {
          case "sendMessage":
            const response = await sidebarProvider.callAIApi(data.text, apiKey);
            webviewView.webview.postMessage({
              type: "response",
              text: response,
            });
            break;
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

async function callAIApi(
  userInput: string,
  codeContext: string,
  context: vscode.ExtensionContext
): Promise<string> {
  let apiKey = await context.secrets.get("deepseekKey");
  console.log("API Key exists:", !!apiKey);

  if (!apiKey) {
    const key = await vscode.window.showInputBox({
      prompt: "Enter your Deepseek API key",
      password: true,
    });
    if (key) {
      await context.secrets.store("deepseekKey", key);
      apiKey = key;
    } else {
      throw new Error("API key is required");
    }
  }

  console.log("Making API request...");

  // Trim the code context to a maximum length
  const MAX_CONTEXT_LENGTH = 1000; // Example limit
  const trimmedContext = codeContext.slice(0, MAX_CONTEXT_LENGTH);

  const data = {
    messages: [
      {
        content: "You are a helpful assistant",
        role: "system",
      },
      {
        content: userInput,
        role: "user",
      },
      {
        content: trimmedContext,
        role: "system",
      },
    ],
    model: "deepseek-chat",
    max_tokens: 2048,
    temperature: 1,
    stream: false,
  };

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.deepseek.com/chat/completions",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    data: data,
    timeout: 30000, // 30 seconds timeout
  };

  let retries = 3; // Number of retries
  let delayMs = 1000; // Initial delay

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  while (retries > 0) {
    try {
      // Add a delay before making the request
      await delay(delayMs);
      const response = await axios(config);
      console.log("API response:", response.data);

      // Check if the response structure is valid
      if (
        response.data &&
        response.data.choices &&
        response.data.choices.length > 0
      ) {
        return `\`\`\`\n${response.data.choices[0].message.content}\n\`\`\``;
      } else {
        console.error("Unexpected response structure:", response.data);
        return "The server is busy. Please try again later."; // Return user-friendly message
      }
    } catch (error: any) {
      if (error.code === "ECONNRESET") {
        console.error("Connection was reset. The server might be busy.");
        return "The server is busy. Please try again later."; // User-friendly message for connection reset
      }
      if (error.response?.status === 429) {
        // Rate limit error
        console.log(
          `Rate limit exceeded. Retrying in ${delayMs / 1000} seconds...`
        );
        await delay(delayMs);
        delayMs *= 2; // Exponential backoff
        retries--;
      } else {
        console.error("API call error:", error.response?.data || error);
        if (error.response) {
          console.error("Response status:", error.response.status);
          console.error("Response data:", error.response.data);
        }
        // Check for invalid JSON response error
        if (error.message.includes("Unexpected end of JSON input")) {
          return "The server is busy. Please try again later."; // Return user-friendly message
        }
        // Return a user-friendly message for other errors
        return "The server is busy. Please try again later.";
      }
    }
  }
  return "The server is busy. Please try again later."; // Final fallback message
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log("DeepCoder Assistant deactivated!"); // Log when the extension is deactivated
}

function getWebviewContent(apiKey: string): string {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DeepCoder Chat</title>
    </head>
    <body>
        <h1>DeepCoder Chat</h1>
        <input type="text" id="userInput" placeholder="Type your message..." />
        <button id="sendButton">Send</button>
        <div id="chatWindow"></div>
        <script>
            const vscode = acquireVsCodeApi();
            document.getElementById('sendButton').onclick = () => {
                const message = document.getElementById('userInput').value;
                if (message) {
                    vscode.postMessage({ type: 'sendMessage', text: message, apiKey: '${apiKey}' });
                    document.getElementById('userInput').value = '';
                }
            };
        </script>
    </body>
    </html>`;
}
