// src/extension.ts
import * as vscode from 'vscode';

let timerPanel: vscode.WebviewPanel | undefined;
let timerInterval: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Timer extension is now active!');

    // Register command to start the timer
    let disposable = vscode.commands.registerCommand('vscode-timer.start', () => {
        if (timerPanel) {
            // If panel already exists, show it
            timerPanel.reveal();
        } else {
            // Create new panel
            timerPanel = vscode.window.createWebviewPanel(
                'timerView',
                'Timer',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true
                }
            );

            // Set initial HTML content
            updateTimerView(timerPanel, 0);

            // Handle messages from the webview
            timerPanel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'start':
                            startTimer();
                            return;
                        case 'pause':
                            pauseTimer();
                            return;
                        case 'reset':
                            resetTimer();
                            return;
                    }
                },
                undefined,
                context.subscriptions
            );

            // Clean up resources when panel is closed
            timerPanel.onDidDispose(
                () => {
                    timerPanel = undefined;
                    if (timerInterval) {
                        clearInterval(timerInterval);
                        timerInterval = undefined;
                    }
                },
                null,
                context.subscriptions
            );
        }
    });

    context.subscriptions.push(disposable);
}

let seconds = 0;
let isRunning = false;

function startTimer() {
    if (isRunning || !timerPanel) { return; }
    
    isRunning = true;
    timerInterval = setInterval(() => {
        seconds++;
        if (timerPanel) {
            updateTimerView(timerPanel, seconds);
        }
    }, 1000);
    
    // Update button state
    timerPanel.webview.postMessage({ command: 'updateButtonState', isRunning: true });
}

function pauseTimer() {
    if (!isRunning || !timerInterval) { return; }
    
    isRunning = false;
    clearInterval(timerInterval);
    timerInterval = undefined;
    
    // Update button state
    if (timerPanel) {
        timerPanel.webview.postMessage({ command: 'updateButtonState', isRunning: false });
    }
}

function resetTimer() {
    pauseTimer();
    seconds = 0;
    if (timerPanel) {
        updateTimerView(timerPanel, seconds);
    }
}

function updateTimerView(panel: vscode.WebviewPanel, seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    
    panel.webview.html = getWebviewContent(timeString, isRunning);
}

function getWebviewContent(timeString: string, isRunning: boolean) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Timer</title>
        <style>
            body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                font-family: Arial, sans-serif;
            }
            .timer {
                font-size: 48px;
                font-weight: bold;
                margin-bottom: 20px;
            }
            .controls {
                display: flex;
                gap: 10px;
            }
            button {
                padding: 10px 20px;
                font-size: 16px;
                cursor: pointer;
                border: none;
                border-radius: 4px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
        </style>
    </head>
    <body>
        <div class="timer">${timeString}</div>
        <div class="controls">
            <button id="startPauseBtn">${isRunning ? 'Pause' : 'Start'}</button>
            <button id="resetBtn">Reset</button>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const startPauseBtn = document.getElementById('startPauseBtn');
            const resetBtn = document.getElementById('resetBtn');

            startPauseBtn.addEventListener('click', () => {
                if (startPauseBtn.textContent === 'Start') {
                    vscode.postMessage({ command: 'start' });
                } else {
                    vscode.postMessage({ command: 'pause' });
                }
            });

            resetBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'reset' });
            });

            window.addEventListener('message', event => {
                const message = event.data;
                
                if (message.command === 'updateButtonState') {
                    startPauseBtn.textContent = message.isRunning ? 'Pause' : 'Start';
                }
            });
        </script>
    </body>
    </html>`;
}

export function deactivate() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
}