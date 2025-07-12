# Development Notes & Learnings

This document tracks the key decisions, troubleshooting steps, and core concepts learned during the development of the AI Commit Message Generator extension. It serves as an internal reference.

## 1. Project Setup and Build Process

The extension is built with TypeScript and requires a compilation step to convert the `.ts` source files into the `.js` files that VS Code actually runs.

- **Installation:** `npm install` reads `package.json` and installs all necessary libraries (like `@google/generative-ai`) into the `node_modules` folder.
- **Compilation:** `npm run compile` executes the TypeScript Compiler (`tsc`). `tsc` uses `tsconfig.json` for its configuration and places the output JavaScript files (like `extension.js`) into the `/out` directory.

---

## 2. Running and Debugging

The standard way to test a VS Code extension is using the **Extension Development Host**.

- **How to Launch:** Pressing `F5` in the main project window starts a new, separate VS Code window. This new window has the extension installed and activated.
- **No File Copying Needed:** You do **not** need to manually copy the compiled `extension.js` file anywhere. The `F5` process automatically loads the extension from the `/out` directory as specified by the `"main": "./out/extension.js"` entry in `package.json`.
- **Applying Changes:** After making changes to the `.ts` files, you must:
  1.  Run `npm run compile` again.
  2.  Reload the Extension Development Host window (Use the Command Palette: `Ctrl+Shift+P` -> `Developer: Reload Window`).

---

## 3. Core VS Code Extension Concepts

- **`package.json` (The Manifest):** This is the most important file. It tells VS Code everything about the extension: its name, its dependencies, and how it integrates with the UI.
  - **`activationEvents`:** Determines when the extension's code should be loaded. We use `"onView:scm"` to activate it only when the user opens the Source Control view, which is very efficient.
  - **`contributes`:** This section is where we add UI elements. We used it to add our command, place a button on the SCM title bar (`menus`), and define all user-configurable settings (`configuration`).
- **`extension.ts` (The Entry Point):** This is the main code file.
  - **`activate()`:** This function is called once when the extension is activated. It's where we register commands and set up listeners.
  - **`deactivate()`:** This function is called when the extension is shut down, used for cleanup.

---

## 4. Key Troubleshooting and Fixes

We encountered and solved several common issues during development.

### a. `tsconfig.json` Errors

1.  **`rootDir` Mismatch:**
    - **Error:** `File is not under 'rootDir'. 'rootDir' is expected to contain all source files.`
    - **Cause:** The `tsconfig.json` was configured with `"rootDir": "src"`, but our `extension.ts` file was in the project root.
    - **Fix:** We moved `extension.ts` into a `src/` directory to match the configuration, which is standard practice for organizing source code.

2.  **Missing Type Definitions:**
    - **Error:** `Cannot find name 'Headers'.`
    - **Cause:** The `@google/generative-ai` library uses web-standard APIs (like `fetch` and `Headers`) that are not included in a standard Node.js environment by default.
    - **Fix:** We added `"DOM"` to the `"lib"` array in `tsconfig.json`. This tells TypeScript to include the type definitions for the browser's Document Object Model (DOM), which includes `Headers`.

### b. Interacting with the Git SCM

1.  **Initial Approach (Problematic):**
    - **Code:** `vscode.scm.sourceControls.find(sc => sc.id === 'git')`
    - **Issue:** This caused a TypeScript error (`Property 'sourceControls' does not exist...`) because the type definitions were not resolving correctly in our environment. This method is also less robust.

2.  **Improved Approach (The Fix):**
    - **Code:**
      ```typescript
      const gitExtension = vscode.extensions.getExtension('vscode.git');
      const git = gitExtension?.exports.getAPI(1);
      git.repositories[0].inputBox.value = commitMessage;
      ```
    - **Reasoning:** This is the officially recommended and most reliable way to interact with VS Code's built-in Git features. It directly gets the API from the Git extension, making it more stable and avoiding type-checking issues.

---

## 5. API Migration: Anthropic Claude to Google Gemini

The core logic was migrated from the Claude API to the Gemini API.

- **Dependencies:** Removed `axios` and added `@google/generative-ai`.
- **API Key:** The configuration in `package.json` and the logic in `extension.ts` were updated to use `geminiApiKey` instead of `anthropicApiKey`.
- **API Call:** The `axios.post` call was replaced with the Gemini SDK's `genAI.getGenerativeModel()` and `model.generateContent()` methods, which simplifies the request logic.

---

## 6. User Configuration and Settings

- **Defining Settings:** All user-facing settings (API Key, Model Choice, etc.) are defined in the `contributes.configuration.properties` section of `package.json`. Using `"type": "string"` with an `"enum"` creates a user-friendly dropdown menu.
- **Accessing Settings:** In the code, we access these settings using `vscode.workspace.getConfiguration('commitGenerator').get('settingName')`.
- **Finding Settings:** Users can find these settings by opening the VS Code Settings UI (`Ctrl+,`) and searching for the extension's name ("Commit Message Generator").

---

## 7. Adopting Conventional Commits

A key decision was made to standardize the output commit messages using the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

- **Why:** This provides a structured format that is easier for humans to read and allows for automated tools (like changelog generators or semantic versioning).
- **Implementation:** The prompt sent to the Gemini API (`src/extension.ts`) was specifically crafted to instruct the model to generate messages following this format (e.g., starting with `feat:`, `fix:`, `docs:`, etc.).