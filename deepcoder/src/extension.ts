// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import axios from 'axios';
import { getWebviewContent } from "./webview/webview";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "deepcoder" is now active!');

  // Register command to open chat
  let disposable = vscode.commands.registerCommand(
    "ai-assistant.openChat",
    async () => {
      const apiKey = await context.secrets.get("deepseekKey");
      if (!apiKey) {
        const key = await vscode.window.showInputBox({
          prompt: "Enter your Deepseek API key",
          password: true,
        });
        if (key) {
          await context.secrets.store("deepseekKey", key);
        } else {
          vscode.window.showErrorMessage("API key is required");
          return;
        }
      }

      // Create chat panel
      const panel = vscode.window.createWebviewPanel(
        "aiChat",
        "AI Assistant",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      panel.webview.html = getWebviewContent();

      // Handle messages from webview
      panel.webview.onDidReceiveMessage(async (message) => {
        try {
          if (message.type === "userInput") {
            panel.webview.postMessage({ type: "status", text: "Thinking..." });

            console.log("Sending request to API..."); // Debug log
            // Get current editor context
            const activeEditor = vscode.window.activeTextEditor;
            const codeContext = activeEditor?.document.getText() || "";

            const response = await callAIApi(
              message.text,
              codeContext,
              context
            );
            console.log("Received response:", response); // Debug log

            panel.webview.postMessage({
              type: "response",
              text: response,
            });
          }
        } catch (error) {
          console.error("Error details:", error); // Debug log
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          panel.webview.postMessage({
            type: "error",
            text: "Failed to get AI response: " + errorMessage,
          });
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
  console.log("API Key exists:", !!apiKey); // Debug log

  if (!apiKey) {
    const key = await vscode.window.showInputBox({
      prompt: "Enter your Deepseek API key",
      password: true,
    });
    if (key) {
      await context.secrets.store("deepseekKey", key);
      apiKey = key; // Use the key directly instead of recursing
    } else {
      throw new Error("API key is required");
    }
  }

  console.log("Making API request..."); // Debug log
  const data = {
    messages: [
      {
        content: "You are a helpful assistant",
        role: "system"
      },
      {
        content: userInput,
        role: "user"
      }
    ],
    model: "deepseek-chat",
    max_tokens: 2048,
    temperature: 1,
    stream: false
  };

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.deepseek.com/chat/completions',
    headers: { 
      'Content-Type': 'application/json', 
      'Accept': 'application/json', 
      'Authorization': `Bearer ${apiKey}`
    },
    data: data
  };

  try {
    const response = await axios(config);
    console.log("API response:", response.data);
    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error("API call error:", error.response?.data || error);
    throw error;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
