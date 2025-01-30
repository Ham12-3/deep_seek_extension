export function getWebviewContent(): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DeepCoder Chat</title>
            <style>
                body { 
                    margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
                    background-color: #000000; /* Light background */
                }
                #chat {
                    height: calc(100vh - 100px);
                    overflow-y: auto;
                    padding: 15px;
                    background: #000000; /* Chat background */
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                    animation: fadeIn 0.5s; /* Animation for chat */
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .message {
                    margin: 10px 0;
                    padding: 10px;
                    border-radius: 10px;
                    max-width: 80%;
                    position: relative;
                    animation: slideIn 0.5s; /* Animation for messages */
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .user-message {
                    background: #dcf8c6; /* User message background */
                    align-self: flex-end;
                    border-top-right-radius: 0; /* Rounded corners */
                }
                .ai-message {
                    background: #f1f0f0; /* AI message background */
                    align-self: flex-start;
                    border-top-left-radius: 0; /* Rounded corners */
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
                    padding: 10px;
                    border: 1px solid #ced4da;
                    border-radius: 20px; /* Rounded input */
                    outline: none;
                    transition: border-color 0.3s;
                }
                #input:focus {
                    border-color: #007bff; /* Focus effect */
                }
                #send-button {
                    padding: 10px 15px;
                    background-color: #007bff; /* Send button color */
                    color: white;
                    border: none;
                    border-radius: 20px; /* Rounded button */
                    cursor: pointer;
                    transition: background-color 0.3s;
                }
                #send-button:hover {
                    background-color: #0056b3; /* Darker on hover */
                }
                #status {
                    font-style: italic;
                    color: #6c757d;
                }
            </style>
        </head>
        <body>
            <div id="chat"></div>
            <div id="status"></div>
            <div id="input-container">
                <input id="input" type="text" placeholder="Type a message..." />
                <button id="send-button" onclick="sendMessage()">Send</button>
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
                    chatDiv.scrollTop = chatDiv.scrollHeight; // Scroll to the bottom
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
