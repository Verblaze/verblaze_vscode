"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const node_fetch_1 = require("node-fetch");
const fs = require("fs");
const path = require("path");
const filters_1 = require("./filters");
async function activate(context) {
    // Create status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    const baseUrl = "https://api.verblaze.com/api/vscode-extension";
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
    // File Translation command
    let fileTranslationCommand = vscode.commands.registerCommand("verblaze.fileTranslation", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found");
            return;
        }
        const cliToken = context.workspaceState.get("verblazeCliToken");
        if (!cliToken) {
            vscode.window.showErrorMessage("Please connect to Verblaze first");
            return;
        }
        const filePath = editor.document.fileName;
        const fileExtension = path.extname(filePath);
        const fileName = path
            .basename(filePath)
            .split(".")
            .shift()
            .toLowerCase();
        // Read patterns from patterns.json
        const patternsPath = path.join(__dirname, "patterns.json");
        const patternsContent = fs.readFileSync(patternsPath, "utf8");
        const patterns = JSON.parse(patternsContent);
        // Find matching technology based on file extension
        const technology = Object.keys(patterns).find((key) => patterns[key].file_extensions &&
            patterns[key].file_extensions.some((ext) => ext === fileExtension));
        if (!technology) {
            vscode.window.showErrorMessage(`Unsupported file type: ${fileExtension}`);
            return;
        }
        // Get the appropriate filter based on the technology
        const technologyFilter = (0, filters_1.getFilterForTechnology)(technology);
        // Get all patterns for the technology
        const allPatterns = [
            ...(patterns[technology].code_patterns || []),
            ...(patterns[technology].jsx_patterns || []),
            ...(patterns[technology].template_patterns || []),
            ...(patterns[technology].ui_patterns || []),
        ];
        // Extract strings using patterns
        const fileContent = editor.document.getText();
        const translations = [];
        const matchPositions = [];
        // Check if the text is already in translation format (file_key.value_key)
        const isTranslationKey = (text) => {
            const translationKeyPattern = /^[a-z0-9_]+\.[a-z0-9_]+$/;
            return translationKeyPattern.test(text.trim());
        };
        // Aralıkların üst üste binip binmediğini kontrol eden fonksiyon
        const hasOverlap = (range1, range2) => {
            // Aralıklar tamamen aynıysa üst üste binmiş sayılır
            if (range1.isEqual(range2)) {
                return true;
            }
            // Bir aralık diğerini içeriyorsa üst üste binmiş sayılır
            if (range1.contains(range2) || range2.contains(range1)) {
                return true;
            }
            // Aralıklar kısmen örtüşüyorsa
            if (range1.intersection(range2)) {
                return true;
            }
            return false;
        };
        // Zaten var olan konum varsa kontrol eden fonksiyon
        const isOverlappingWithExisting = (range) => {
            return matchPositions.some((pos) => hasOverlap(pos.range, range));
        };
        for (const patternObj of allPatterns) {
            const regex = new RegExp(patternObj.pattern, "g");
            let match;
            while ((match = regex.exec(fileContent)) !== null) {
                // match[1] is from first capture group (single quotes), match[2] is from second capture group (double quotes)
                const extractedText = match[1] || match[2];
                if (extractedText &&
                    extractedText.trim() &&
                    !patterns[technology].prefixes_to_ignore.some((prefix) => extractedText.trim().startsWith(prefix)) &&
                    !isTranslationKey(extractedText) // Skip if it's already a translation key
                ) {
                    const trimmedText = extractedText.trim();
                    // Flutter için print ve debugPrint fonksiyonlarında bulunan metinleri atla
                    if (technology.toLowerCase() === "flutter") {
                        // Tüm satırı elde etmek için, eşleşen metnin başlangıç pozisyonundan önceki metni al
                        const lineStart = editor.document.lineAt(editor.document.positionAt(match.index)).lineNumber;
                        const line = editor.document.lineAt(lineStart).text.trim();
                        // print, debugPrint, log, assert, throw gibi fonksiyonlarda bulunan metinleri atla
                        const flutterFunctionPatterns = [
                            /print\s*\(/i,
                            /debugPrint\s*\(/i,
                            /log\s*\(/i,
                            /logger\.[a-zA-Z]+\s*\(/i, // logger.info(), logger.error() vb.
                            /assert\s*\(/i,
                            /throw\s*\w+\(/i,
                            /console\.[a-zA-Z]+\s*\(/i, // console.log, console.error vb.
                            /Sentry\.[a-zA-Z]+\s*\(/i, // Sentry.captureMessage vb.
                            /FirebaseCrashlytics\.instance\.log\s*\(/i,
                        ];
                        if (flutterFunctionPatterns.some((pattern) => pattern.test(line))) {
                            continue; // Bu metni atla
                        }
                    }
                    // Uygula gelişmiş filtrelemeyi
                    if (technologyFilter && technology.toLowerCase() === "swift") {
                        // Swift için özel filtreleme
                        if (!technologyFilter.shouldTranslate(trimmedText, patterns[technology].filtering_patterns, patterns[technology].keywords_to_ignore)) {
                            continue; // Bu stringi atla
                        }
                    }
                    // Calculate the range for this match
                    // Find the actual quote content in the original match
                    const fullMatch = match[0];
                    const quoteStart = fullMatch.indexOf(extractedText);
                    const startPos = editor.document.positionAt(match.index + quoteStart);
                    const endPos = editor.document.positionAt(match.index + quoteStart + extractedText.length);
                    const range = new vscode.Range(startPos, endPos);
                    // Eğer bu aralık daha önce bulunan herhangi bir aralıkla çakışıyorsa, bu eşleşmeyi atla
                    if (isOverlappingWithExisting(range)) {
                        continue;
                    }
                    translations.push(trimmedText);
                    matchPositions.push({
                        value: trimmedText,
                        range: range,
                    });
                }
            }
        }
        if (translations.length === 0) {
            vscode.window.showInformationMessage("No translatable strings found in the file");
            return;
        }
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Processing file translations...",
            cancellable: false,
        }, async () => {
            try {
                console.log(baseUrl + "/file-translations");
                const response = await (0, node_fetch_1.default)(`${baseUrl}/file-translations`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${cliToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        translations: translations,
                        fileKey: fileName,
                    }),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, ${response.statusText}, ${await response.text()}`);
                }
                const result = (await response.json());
                // Replace the strings in the editor with their value_keys
                await editor.edit((editBuilder) => {
                    for (const position of matchPositions) {
                        const translation = result.data.translations.find((t) => t.value === position.value);
                        if (translation) {
                            if (translation.is_locked) {
                                vscode.window.showWarningMessage(`Translation "${translation.value}" is locked and will be skipped.`);
                                continue;
                            }
                            editBuilder.replace(position.range, `${result.data.file_key}.${translation.value_key}`);
                        }
                    }
                });
                const skippedCount = result.data.metadata.locked_count;
                const totalCount = result.data.total;
                const processedCount = totalCount - skippedCount;
                vscode.window.showInformationMessage(`Successfully processed ${processedCount} strings${skippedCount > 0
                    ? ` (${skippedCount} locked translations skipped)`
                    : ""}`);
            }
            catch (error) {
                vscode.window.showErrorMessage("Failed to process file translations");
                console.error("File translation error:", error);
            }
        });
    });
    // Initial state check
    const existingToken = context.workspaceState.get("verblazeCliToken");
    updateStatusBarItem(!!existingToken);
    // Add commands to context
    context.subscriptions.push(loginCommand, logoutCommand, translateCommand, searchCommand, fileTranslationCommand);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map