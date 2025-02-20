"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const node_fetch_1 = require("node-fetch");
async function activate(context) {
    // Create status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    const baseUrl = process.env.VSCODE_DEBUG_MODE === "true"
        ? "http://localhost:4000/api/vscode-extension"
        : "https://api.verblaze.com/api/vscode-extension";
    console.log("baseUrl", baseUrl);
    statusBarItem.command = "verblaze.login";
    context.subscriptions.push(statusBarItem);
    // Update status bar function
    function updateStatusBarItem(isLoggedIn) {
        statusBarItem.text = isLoggedIn
            ? "$(check) Verblaze"
            : "$(sign-in) Verblaze: Login";
        statusBarItem.tooltip = isLoggedIn
            ? "Connected to Verblaze"
            : "Click to connect to Verblaze";
        statusBarItem.show();
    }
    // Token validation function
    async function validateToken(token) {
        try {
            const response = await (0, node_fetch_1.default)(`${baseUrl}/validate`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.status === 200;
        }
        catch (error) {
            console.error("Token validation error:", error);
            return false;
        }
    }
    // UUID validation function
    function isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    // Login command
    let loginCommand = vscode.commands.registerCommand("verblaze.login", async () => {
        const cliToken = await vscode.window.showInputBox({
            prompt: "Enter your Verblaze CLI Token",
            password: true,
            placeHolder: "Example: 48******-e***-4***-b***-4***********",
            ignoreFocusOut: true,
            validateInput: (value) => {
                return isValidUUID(value) ? null : "Invalid UUID format";
            },
        });
        if (cliToken) {
            try {
                const isValid = await validateToken(cliToken);
                if (isValid) {
                    await context.workspaceState.update("verblazeCliToken", cliToken);
                    vscode.window.showInformationMessage("Successfully connected to Verblaze");
                    updateStatusBarItem(true);
                }
                else {
                    vscode.window.showErrorMessage("Invalid CLI token");
                }
            }
            catch (error) {
                vscode.window.showErrorMessage("Failed to validate token");
            }
        }
    });
    // Logout command
    let logoutCommand = vscode.commands.registerCommand("verblaze.logout", async () => {
        await context.workspaceState.update("verblazeCliToken", undefined);
        vscode.window.showInformationMessage("Disconnected from Verblaze");
        updateStatusBarItem(false);
    });
    // Translation command
    let translateCommand = vscode.commands.registerCommand("verblaze.translate", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found");
            return;
        }
        const selection = editor.selection;
        const text = editor.document
            .getText(selection)
            .replace(/'/g, "")
            .replace(/`/g, "")
            .trim();
        if (!text) {
            vscode.window.showErrorMessage("Please select text to translate");
            return;
        }
        const cliToken = context.workspaceState.get("verblazeCliToken");
        if (!cliToken) {
            vscode.window.showErrorMessage("Please connect to Verblaze first");
            return;
        }
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating translation key...",
            cancellable: false,
        }, async () => {
            try {
                const fileKey = editor.document.fileName
                    .split("/")
                    .pop()
                    .split(".")
                    .shift()
                    .toLowerCase();
                const response = await (0, node_fetch_1.default)(`${baseUrl}/translate`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${cliToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        value: text,
                        fileKey,
                    }),
                });
                console.log(response);
                const result = (await response.json());
                console.log(result);
                const valueKey = result?.data?.value_key;
                console.log(valueKey);
                if (valueKey) {
                    await editor.edit((editBuilder) => {
                        editBuilder.replace(selection, `${fileKey}.${valueKey}`);
                    });
                    vscode.window.showInformationMessage("Text successfully converted to translation key");
                }
                else {
                    vscode.window.showErrorMessage("Failed to generate translation key");
                }
            }
            catch (error) {
                vscode.window.showErrorMessage("Translation operation failed");
            }
        });
    });
    // Search command
    let searchCommand = vscode.commands.registerCommand("verblaze.search", async () => {
        const searchQuery = await vscode.window.showInputBox({
            prompt: "Enter text to search",
            placeHolder: "e.g., Welcome",
        });
        if (!searchQuery)
            return;
        const cliToken = context.workspaceState.get("verblazeCliToken");
        if (!cliToken) {
            vscode.window.showErrorMessage("Please connect to Verblaze first");
            return;
        }
        try {
            const response = await (0, node_fetch_1.default)(`${baseUrl}/search`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${cliToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: searchQuery,
                }),
            });
            const results = (await response.json());
            if (results.data && results.data.length > 0) {
                const items = results.data.map((item) => ({
                    label: item.value,
                    description: item.value_key,
                    detail: `Language: ${item.language}`,
                }));
                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: "Select a translation",
                });
                if (selected) {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        await editor.edit((editBuilder) => {
                            editBuilder.insert(editor.selection.active, `${selected.description}`);
                        });
                    }
                }
            }
            else {
                vscode.window.showInformationMessage("No results found");
            }
        }
        catch (error) {
            vscode.window.showErrorMessage("Search operation failed");
        }
    });
    // Initial state check
    const existingToken = context.workspaceState.get("verblazeCliToken");
    updateStatusBarItem(!!existingToken);
    // Add commands to context
    context.subscriptions.push(loginCommand, logoutCommand, translateCommand, searchCommand);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map