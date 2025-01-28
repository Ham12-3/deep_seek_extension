export function getWebviewContent(): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    padding: 15px;
                    font-family: var(--vscode-font-family);
                }
                #chat {
                    height: calc(100vh - 100px);
                    overflow-y: auto;
                    margin-bottom: 10px;
                }
                .message {
                    margin: 10px 0;
                    padding: 10px;
                    border-radius: 5px;
                }
                .user-message {
                    background: var(--vscode-editor-background);
                }
                .ai-message {
                    background: var(--vscode-editor-selectionBackground);
                }
                #input-container {
                    position: fixed;
                    bottom: 15px;
                    left: 15px;
                    right: 15px;
                    display: flex;
                    gap: 10px;
                }
                #input {
                    flex: 1;
                    padding: 8px;
                }
                #status {
                    font-style: italic;
                    color: var(--vscode-descriptionForeground);
                }
            </style>
        </head>
        <body>
            <div id="chat"></div>
            <div id="status"></div>
            <div id="input-container">
                <input id="input" type="text" placeholder="Ask me anything..." />
                <button onclick="sendMessage()">Send</button>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                const chatDiv = document.getElementById('chat');
                const statusDiv = document.getElementById('status');
                const input = document.getElementById('input');

                function sendMessage() {
                    const text = input.value.trim();
                    if (!text) return;

                    appendMessage('user', text);
                    vscode.postMessage({ type: 'userInput', text });
                    input.value = '';
                }

                function appendMessage(sender, text) {
                    const div = document.createElement('div');
                    div.className = \`message \${sender}-message\`;
                    div.textContent = text;
                    chatDiv.appendChild(div);
                    chatDiv.scrollTop = chatDiv.scrollHeight;
                }

                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') sendMessage();
                });

                window.addEventListener('message', (event) => {
                    const message = event.data;
                    switch (message.type) {
                        case 'response':
                            appendMessage('ai', message.text);
                            statusDiv.textContent = '';
                            break;
                        case 'status':
                            statusDiv.textContent = message.text;
                            break;
                        case 'error':
                            statusDiv.textContent = message.text;
                            break;
                    }
                });
            </script>
        </body>
        </html>
    `;
}
