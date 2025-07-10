import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GoogleGenerativeAI } from '@google/generative-ai';

const execAsync = promisify(exec);

export function activate(context: vscode.ExtensionContext) {
    // Register the command to generate commit messages
    const disposable = vscode.commands.registerCommand('commitGenerator.generateMessage', async () => {
        try {
            await generateCommitMessage();
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating commit message: ${error}`);
        }
    });

    context.subscriptions.push(disposable);

    // Update the command title with the user's name
    updateCommandTitle();
    
    // Listen for configuration changes to update the command title
    vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('commitGenerator.yourName')) {
            updateCommandTitle();
        }
    });
}

function updateCommandTitle() {
    const config = vscode.workspace.getConfiguration('commitGenerator');
    const yourName = config.get<string>('yourName') || 'Gemini';
    
    // Update the command title dynamically
    vscode.commands.executeCommand('setContext', 'commitGenerator.buttonText', `Generate message with ${yourName}`);
}

async function generateCommitMessage() {
    const config = vscode.workspace.getConfiguration('commitGenerator');
    const apiKey = config.get<string>('geminiApiKey');
    const maxDiffLength = config.get<number>('maxDiffLength') || 8000;

    if (!apiKey) {
        const result = await vscode.window.showInformationMessage(
            'Please set your Gemini API key in the settings to use this feature.',
            'Open Settings'
        );
        if (result === 'Open Settings') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'commitGenerator.geminiApiKey');
        }
        return;
    }

    // Show progress indicator
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating commit message...",
        cancellable: false
    }, async (progress) => {
        try {
            // Get the current workspace folder
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            // Get staged changes
            const { stdout: stagedDiff } = await execAsync('git diff --cached', {
                cwd: workspaceFolder.uri.fsPath
            });

            if (!stagedDiff.trim()) {
                vscode.window.showInformationMessage('No staged changes found. Please stage some changes first.');
                return;
            }

            // Truncate diff if it's too long
            const diff = stagedDiff.length > maxDiffLength 
                ? stagedDiff.substring(0, maxDiffLength) + '\n\n[Diff truncated due to length]'
                : stagedDiff;

            progress.report({ increment: 50 });

            // Generate commit message using Gemini
            const commitMessage = await generateMessageWithGemini(diff, apiKey);

            progress.report({ increment: 100 });

            // Get the Git extension API to interact with the SCM input box
            const gitExtension = vscode.extensions.getExtension('vscode.git');
            const git = gitExtension?.exports.getAPI(1);

            if (git && git.repositories.length > 0) {
                // Set the commit message in the first repository's input box
                git.repositories[0].inputBox.value = commitMessage;
                vscode.window.showInformationMessage('Commit message generated successfully!');
            } else {
                // Fallback: show the message in a dialog if Git SCM is not found or no repo is open
                const result = await vscode.window.showInformationMessage(
                    'Generated commit message (Git SCM not found):',
                    { modal: true, detail: commitMessage },
                    'Copy to Clipboard'
                );
                if (result === 'Copy to Clipboard') {
                    await vscode.env.clipboard.writeText(commitMessage);
                    vscode.window.showInformationMessage('Commit message copied to clipboard!');
                }
            }

        } catch (error) {
            throw error;
        }
    });
}

async function generateMessageWithGemini(diff: string, apiKey: string): Promise<string> {
    const prompt = `Please generate a concise, clear commit message for the following git diff. The commit message should:
1. Use conventional commit format (e.g., "feat:", "fix:", "docs:", etc.)
2. Be descriptive but concise
3. Focus on what was changed and why
4. Use present tense ("add" not "added")

Here's the git diff:

${diff}

Please respond with only the commit message, nothing else.`;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-1.5-flash-latest as it's fast and cost-effective for this kind of task.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        return text.trim();
    } catch (error: any) {
        // The Gemini SDK throws errors with user-friendly messages.
        // We can check for specific strings if needed, but for now, the raw message is often good enough.
        if (error.message?.includes('API key not valid')) {
            throw new Error('Invalid API key. Please check your Gemini API key in settings.');
        } else if (error.message?.includes('429')) { // Gemini API uses 429 for rate limits
            throw new Error('Rate limit exceeded. Please try again later.');
        } else {
            throw new Error(`Failed to generate commit message: ${error.message}`);
        }
    }
}

export function deactivate() {}
