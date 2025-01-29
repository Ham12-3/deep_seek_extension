// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import axios from "axios";
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
            text: "The server is busy. Please try again later.",
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
        return response.data.choices[0].message.content;
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
export function deactivate() {}
