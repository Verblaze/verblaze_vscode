# Verblaze VSCode Extension Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Authentication](#authentication)
4. [Features](#features)
5. [Implementation Details](#implementation-details)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Introduction

Verblaze VSCode Extension is a powerful tool designed to streamline the translation management process directly within your development environment. This extension integrates seamlessly with the Verblaze translation management system, offering features like instant translation, smart search, and bulk translation management.

### Key Benefits

- Seamless integration with VSCode
- Real-time translation management
- Smart context-aware translations
- Team collaboration support
- Automated key management

## Installation

1. Install from VSCode Marketplace
2. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
3. Type `Verblaze: Login` and press Enter
4. Enter your CLI token when prompted

The extension provides the following commands in the Command Palette:

- `Verblaze: Login` - Authenticate with your CLI token
- `Verblaze: Logout` - Remove authentication
- `Verblaze: Search Translations` - Search through translations
- `Verblaze: Translate File` - Translate all strings in current file

```json
{
  "contributes": {
    "commands": [
      {
        "command": "verblaze.login",
        "title": "Verblaze: Login with CLI Token"
      },
      {
        "command": "verblaze.logout",
        "title": "Verblaze: Logout"
      }
    ]
  }
}
```

## Authentication

### CLI Token Setup

The extension uses CLI token-based authentication through the Command Palette, providing a seamless login experience.

```typescript
// Command registration
export function activate(context: vscode.ExtensionContext) {
  // Register login command
  let loginCommand = vscode.commands.registerCommand(
    "verblaze.login",
    async () => {
      const cliToken = await vscode.window.showInputBox({
        prompt: "Enter your Verblaze CLI Token",
        password: true,
        placeHolder: "sk-cli-xxxxxxxxxxxxxxxx",
        ignoreFocusOut: true,
        validateInput: (value: string) => {
          return value.startsWith("sk-cli-") ? null : "Invalid token format";
        },
      });

      if (cliToken) {
        try {
          const isValid = await validateToken(cliToken);
          if (isValid) {
            await context.workspaceState.update("verblazeCliToken", cliToken);
            vscode.window.showInformationMessage(
              "Successfully logged in to Verblaze"
            );
            updateStatusBarItem(true);
          } else {
            vscode.window.showErrorMessage("Invalid CLI token");
          }
        } catch (error) {
          vscode.window.showErrorMessage("Failed to validate token");
        }
      }
    }
  );

  // Register logout command
  let logoutCommand = vscode.commands.registerCommand(
    "verblaze.logout",
    async () => {
      await context.workspaceState.update("verblazeCliToken", undefined);
      vscode.window.showInformationMessage("Logged out from Verblaze");
      updateStatusBarItem(false);
    }
  );

  // Add status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "verblaze.login";
  context.subscriptions.push(statusBarItem);

  // Update status bar based on authentication state
  function updateStatusBarItem(isLoggedIn: boolean) {
    statusBarItem.text = isLoggedIn
      ? "$(check) Verblaze"
      : "$(sign-in) Verblaze: Login";
    statusBarItem.tooltip = isLoggedIn
      ? "Logged in to Verblaze"
      : "Click to login to Verblaze";
    statusBarItem.show();
  }

  // Initial status check
  const existingToken = context.workspaceState.get("verblazeCliToken");
  updateStatusBarItem(!!existingToken);

  context.subscriptions.push(loginCommand, logoutCommand);
}
```

### Token Validation

```typescript
async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch("your-api/vscode-extension/validate", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.status === 200;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
}
```

### Authentication Flow

1. **Login Process**:

   - Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
   - Type `Verblaze: Login`
   - Enter CLI token in the input box
   - Token is validated and stored securely
   - Status bar updates to show login state

2. **Logout Process**:

   - Open Command Palette
   - Type `Verblaze: Logout`
   - Token is removed and status bar updates

3. **Status Indication**:

   - Status bar shows current login state
   - Green checkmark when logged in
   - Sign-in icon when logged out
   - Click to trigger login/logout

4. **Token Management**:
   - Secure storage in workspace state
   - Automatic validation on startup
   - Easy token refresh through Command Palette

## Features

### 1. Context Menu Translation

Right-click translation support for instant string translation and key generation.

#### Configuration

```json
{
  "contributes": {
    "menus": {
      "editor/context": [
        {
          "when": "editorHasSelection",
          "command": "verblaze.translate",
          "group": "navigation"
        }
      ]
    }
  }
}
```

#### Implementation

```typescript
export async function translateSelection(editor: vscode.TextEditor) {
  const selection = editor.selection;
  const text = editor.document.getText(selection);
  const fileKey = editor.document.fileName;

  try {
    const cliToken = await getCliToken();
    const response = await fetch("your-api/vscode-extension/translate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cliToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        value: text,
        fileKey: fileKey,
      }),
    });

    const result = await response.json();
    if (result.data?.value_key) {
      await editor.edit((editBuilder) => {
        editBuilder.replace(selection, `t('${result.data.value_key}')`);
      });
    }
  } catch (error) {
    vscode.window.showErrorMessage("Translation failed");
  }
}
```

### 2. Advanced Search

Powerful search functionality with filtering options through the command palette.

#### Search Options Interface

```typescript
interface SearchOptions {
  languages?: string[];
  fileKeys?: string[];
  exactMatch?: boolean;
  caseSensitive?: boolean;
}
```

#### Search Implementation

```typescript
export async function searchTranslations() {
  const searchOptions: SearchOptions = await showSearchOptionsDialog();
  const searchQuery = await vscode.window.showInputBox({
    prompt: "Enter search term",
  });

  if (!searchQuery) return;

  try {
    const cliToken = await getCliToken();
    const response = await fetch("your-api/vscode-extension/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cliToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        filters: searchOptions,
      }),
    });

    const results = await response.json();
    showSearchResults(results.data);
  } catch (error) {
    vscode.window.showErrorMessage("Search failed");
  }
}
```

### 3. File-wide Translation Management

Bulk translation management for entire files.

```typescript
export async function translateFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const fileKey = editor.document.fileName;

  try {
    const cliToken = await getCliToken();
    const response = await fetch(
      "your-api/vscode-extension/file-translations",
      {
        headers: {
          Authorization: `Bearer ${cliToken}`,
        },
        params: {
          fileKey,
        },
      }
    );

    const result = await response.json();
    if (result.data?.translations) {
      const replacements = new Map(
        result.data.translations.map((t: any) => [
          t.value,
          `t('${t.value_key}')`,
        ])
      );

      const document = editor.document;
      const text = document.getText();

      await editor.edit((editBuilder) => {
        for (const [value, key] of replacements) {
          const regex = new RegExp(`(['"]${value}['"])`, "g");
          let match;
          while ((match = regex.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            editBuilder.replace(new vscode.Range(startPos, endPos), key);
          }
        }
      });
    }
  } catch (error) {
    vscode.window.showErrorMessage("File translation failed");
  }
}
```

## Implementation Details

### Backend Integration

The extension communicates with the Verblaze backend through secure API endpoints:

1. **Translation Endpoint**

   ```
   POST /api/vscode-extension/translate
   Authorization: Bearer <cli-token>
   ```

2. **Search Endpoint**

   ```
   POST /api/vscode-extension/search
   Authorization: Bearer <cli-token>
   ```

3. **File Translation Endpoint**
   ```
   GET /api/vscode-extension/file-translations
   Authorization: Bearer <cli-token>
   ```

### Security Considerations

1. **Token Management**

   - Secure storage in workspace state
   - Automatic token validation
   - Token refresh mechanism

2. **API Security**
   - HTTPS endpoints
   - Token-based authentication
   - Request validation

### Performance Optimizations

1. **Caching**

   - Translation cache
   - Search results cache
   - File translation cache

2. **Batch Processing**
   - Bulk string replacement
   - Debounced search
   - Progressive loading

## Best Practices

### Code Organization

1. **Modular Structure**

   - Separate concerns
   - Clear interfaces
   - Reusable components

2. **Error Handling**
   - Graceful degradation
   - User-friendly messages
   - Detailed logging

### User Experience

1. **Visual Feedback**

   - Progress indicators
   - Success/failure notifications
   - Status bar updates

2. **Performance**
   - Responsive UI
   - Background processing
   - Efficient updates

## Troubleshooting

### Common Issues

1. **Authentication Problems**

   - Invalid token
   - Token expiration
   - Network issues

2. **Translation Issues**
   - Missing translations
   - Failed updates
   - Sync problems

### Solutions

1. **Authentication**

   - Verify CLI token
   - Check network connection
   - Refresh token if needed

2. **Translation**
   - Check file permissions
   - Verify API access
   - Review error logs

## Development Workflow

1. **Setup**

   ```bash
   npm install
   npm run compile
   ```

2. **Testing**

   ```bash
   npm run test
   ```

3. **Deployment**
   ```bash
   vsce package
   vsce publish
   ```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Submit a pull request

## Support

For support, please contact:

- Email: support@verblaze.com
- Discord: [Verblaze Community](https://discord.gg/verblaze)
- GitHub Issues: [Project Repository](https://github.com/verblaze/vscode-extension)
