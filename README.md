# AI Commit Message Generator

A VS Code extension that generates commit messages using Claude AI, similar to the Cline feature you saw!

## Features

- 🚀 Generate commit messages with a single click
- 🎯 Appears as a button in the Source Control view
- 🔧 Customizable button text with your name
- 📝 Uses conventional commit format
- ⚡ Analyzes staged changes automatically

## Installation

### Method 1: Install from Files

1. Create a new folder for your extension: `mkdir commit-message-generator`
2. Copy all the provided files into this folder
3. Open terminal in the folder and run:
   ```bash
   npm install
   npm run compile
   ```
4. Press `F5` in VS Code to launch Extension Development Host
5. Test the extension in the new window

### Method 2: Package and Install

1. Install vsce (Visual Studio Code Extension manager):
   ```bash
   npm install -g vsce
   ```
2. In your extension folder, run:
   ```bash
   vsce package
   ```
3. Install the generated `.vsix` file:
   ```bash
   code --install-extension commit-message-generator-1.0.0.vsix
   ```

## Setup

1. **Get your Anthropic API key:**
   - Sign up at [Anthropic](https://console.anthropic.com/)
   - Create an API key
   - Copy the key

2. **Configure the extension:**
   - Open VS Code Settings (`Ctrl+,`)
   - Search for "Commit Message Generator"
   - Set your API key in "Anthropic Api Key"
   - Optionally, change "Your Name" to customize the button text

## Usage

1. Make some changes to your code
2. Stage the changes you want to commit (`git add` or use VS Code's Source Control view)
3. In the Source Control view, click the "Generate message with [YourName]" button
4. The AI will analyze your staged changes and generate a commit message
5. Review and edit the message if needed
6. Commit your changes!

## Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| `commitGenerator.anthropicApiKey` | Your Anthropic API key | "" |
| `commitGenerator.yourName` | Name to display in the button | "Claude" |
| `commitGenerator.maxDiffLength` | Maximum diff length to send to Claude | 8000 |

## File Structure

```
commit-message-generator/
├── package.json          # Extension manifest
├── tsconfig.json         # TypeScript config
├── src/
│   └── extension.ts      # Main extension code
├── README.md            # This file
└── out/                 # Compiled JavaScript (generated)
```

## Development

To modify the extension:

1. Edit `src/extension.ts`
2. Run `npm run compile` to build
3. Press `F5` to test in Extension Development Host
4. Make changes and reload the extension host window

## Troubleshooting

**Button not showing:**
- Make sure you're in a Git repository
- Check that the extension is activated
- Try reloading VS Code

**API key issues:**
- Verify your API key is correct
- Check your Anthropic account has credits
- Ensure you have internet connection

**No staged changes:**
- The extension only works with staged changes
- Use `git add` or VS Code's Source Control view to stage files

## Contributing

Feel free to modify and improve this extension! Some ideas:
- Add support for different AI models
- Implement commit message templates
- Add more customization options
- Support for different commit formats

## License

MIT License - Feel free to use and modify as needed!
