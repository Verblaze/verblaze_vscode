import * as vscode from "vscode";
import fetch from "node-fetch";
import * as fs from "fs";
import * as path from "path";
import { getFilterForTechnology } from "./filters";

interface TranslationResponse {
  data?: {
    value_key: string;
  };
}

interface SearchResult {
  value: string;
  value_key: string;
  language: string;
}

interface SearchResponse {
  data: SearchResult[];
}

interface Pattern {
  name: string;
  pattern: string;
}

interface Technology {
  file_extensions: string[];
  code_patterns: Pattern[];
  jsx_patterns?: Pattern[];
  template_patterns?: Pattern[];
  ui_patterns?: Pattern[];
  prefixes_to_ignore: string[];
  filtering_patterns?: string[];
  keywords_to_ignore?: string[];
}

interface Patterns {
  [key: string]: Technology;
}

interface FileTranslation {
  value_key: string;
  value: string;
  is_locked: boolean;
}

interface FileTranslationMetadata {
  locked_count: number;
  total_count: number;
}

interface FileTranslationResponse {
  statusCode: number;
  data: {
    file_key: string;
    file_title: string;
    translations: FileTranslation[];
    language: string;
    total: number;
    metadata: FileTranslationMetadata;
  };
}

export async function activate(context: vscode.ExtensionContext) {
  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  const baseUrl = "https://api.verblaze.com/api/vscode-extension";
  console.log("baseUrl", baseUrl);
  statusBarItem.command = "verblaze.login";
  context.subscriptions.push(statusBarItem);

  // Update status bar function
  function updateStatusBarItem(isLoggedIn: boolean) {
    statusBarItem.text = isLoggedIn
      ? "$(check) Verblaze"
      : "$(sign-in) Verblaze: Login";
    statusBarItem.tooltip = isLoggedIn
      ? "Connected to Verblaze"
      : "Click to connect to Verblaze";
    statusBarItem.show();
  }

  // Token validation function
  async function validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${baseUrl}/validate`, {
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

  // UUID validation function
  function isValidUUID(uuid: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Login command
  let loginCommand = vscode.commands.registerCommand(
    "verblaze.login",
    async () => {
      const cliToken = await vscode.window.showInputBox({
        prompt: "Enter your Verblaze CLI Token",
        password: true,
        placeHolder: "Example: 48******-e***-4***-b***-4***********",
        ignoreFocusOut: true,
        validateInput: (value: string) => {
          return isValidUUID(value) ? null : "Invalid UUID format";
        },
      });

      if (cliToken) {
        try {
          const isValid = await validateToken(cliToken);
          if (isValid) {
            await context.workspaceState.update("verblazeCliToken", cliToken);
            vscode.window.showInformationMessage(
              "Successfully connected to Verblaze"
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

  // Logout command
  let logoutCommand = vscode.commands.registerCommand(
    "verblaze.logout",
    async () => {
      await context.workspaceState.update("verblazeCliToken", undefined);
      vscode.window.showInformationMessage("Disconnected from Verblaze");
      updateStatusBarItem(false);
    }
  );

  // Translation command
  let translateCommand = vscode.commands.registerCommand(
    "verblaze.translate",
    async () => {
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

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Generating translation key...",
          cancellable: false,
        },
        async () => {
          try {
            const fileKey = editor.document.fileName
              .split("/")
              .pop()!
              .split(".")
              .shift()!
              .toLowerCase();

            const response = await fetch(`${baseUrl}/translate`, {
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

            const result = (await response.json()) as TranslationResponse;
            console.log(result);
            const valueKey = result?.data?.value_key;
            console.log(valueKey);
            if (valueKey) {
              await editor.edit((editBuilder) => {
                editBuilder.replace(selection, `${fileKey}.${valueKey}`);
              });
              vscode.window.showInformationMessage(
                "Text successfully converted to translation key"
              );
            } else {
              vscode.window.showErrorMessage(
                "Failed to generate translation key"
              );
            }
          } catch (error) {
            vscode.window.showErrorMessage("Translation operation failed");
          }
        }
      );
    }
  );

  // Search command
  let searchCommand = vscode.commands.registerCommand(
    "verblaze.search",
    async () => {
      const searchQuery = await vscode.window.showInputBox({
        prompt: "Enter text to search",
        placeHolder: "e.g., Welcome",
      });

      if (!searchQuery) return;

      const cliToken = context.workspaceState.get("verblazeCliToken");
      if (!cliToken) {
        vscode.window.showErrorMessage("Please connect to Verblaze first");
        return;
      }

      try {
        const response = await fetch(`${baseUrl}/search`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cliToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
          }),
        });

        const results = (await response.json()) as SearchResponse;
        if (results.data && results.data.length > 0) {
          const items = results.data.map((item: SearchResult) => ({
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
                editBuilder.insert(
                  editor.selection.active,
                  `${selected.description}`
                );
              });
            }
          }
        } else {
          vscode.window.showInformationMessage("No results found");
        }
      } catch (error) {
        vscode.window.showErrorMessage("Search operation failed");
      }
    }
  );

  // File Translation command
  let fileTranslationCommand = vscode.commands.registerCommand(
    "verblaze.fileTranslation",
    async () => {
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
        .shift()!
        .toLowerCase();

      // Read patterns from patterns.json
      const patternsPath = path.join(__dirname, "patterns.json");
      const patternsContent = fs.readFileSync(patternsPath, "utf8");
      const patterns: Patterns = JSON.parse(patternsContent);

      // Find matching technology based on file extension
      const technology = Object.keys(patterns).find(
        (key) =>
          patterns[key].file_extensions &&
          patterns[key].file_extensions.some((ext) => ext === fileExtension)
      );

      if (!technology) {
        vscode.window.showErrorMessage(
          `Unsupported file type: ${fileExtension}`
        );
        return;
      }

      // Get the appropriate filter based on the technology
      const technologyFilter = getFilterForTechnology(technology);

      // Get all patterns for the technology
      const allPatterns = [
        ...(patterns[technology].code_patterns || []),
        ...(patterns[technology].jsx_patterns || []),
        ...(patterns[technology].template_patterns || []),
        ...(patterns[technology].ui_patterns || []),
      ];

      // Extract strings using patterns
      const fileContent = editor.document.getText();
      const translations: string[] = [];
      const matchPositions: { value: string; range: vscode.Range }[] = [];

      // Check if the text is already in translation format (file_key.value_key)
      const isTranslationKey = (text: string): boolean => {
        const translationKeyPattern = /^[a-z0-9_]+\.[a-z0-9_]+$/;
        return translationKeyPattern.test(text.trim());
      };

      // Aralıkların üst üste binip binmediğini kontrol eden fonksiyon
      const hasOverlap = (
        range1: vscode.Range,
        range2: vscode.Range
      ): boolean => {
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
      const isOverlappingWithExisting = (range: vscode.Range): boolean => {
        return matchPositions.some((pos) => hasOverlap(pos.range, range));
      };

      for (const patternObj of allPatterns) {
        const regex = new RegExp(patternObj.pattern, "g");
        let match;

        while ((match = regex.exec(fileContent)) !== null) {
          // match[1] is from first capture group (single quotes), match[2] is from second capture group (double quotes)
          const extractedText = match[1] || match[2];
          if (
            extractedText &&
            extractedText.trim() &&
            !patterns[technology].prefixes_to_ignore.some((prefix) =>
              extractedText.trim().startsWith(prefix)
            ) &&
            !isTranslationKey(extractedText) // Skip if it's already a translation key
          ) {
            const trimmedText = extractedText.trim();

            // Flutter için print ve debugPrint fonksiyonlarında bulunan metinleri atla
            if (technology.toLowerCase() === "flutter") {
              // Tüm satırı elde etmek için, eşleşen metnin başlangıç pozisyonundan önceki metni al
              const lineStart = editor.document.lineAt(
                editor.document.positionAt(match.index)
              ).lineNumber;
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

              if (
                flutterFunctionPatterns.some((pattern) => pattern.test(line))
              ) {
                continue; // Bu metni atla
              }
            }

            // Uygula gelişmiş filtrelemeyi
            if (technologyFilter && technology.toLowerCase() === "swift") {
              // Swift için özel filtreleme
              if (
                !technologyFilter.shouldTranslate(
                  trimmedText,
                  patterns[technology].filtering_patterns,
                  patterns[technology].keywords_to_ignore
                )
              ) {
                continue; // Bu stringi atla
              }
            }

            // Calculate the range for this match
            // Find the actual quote content in the original match
            const fullMatch = match[0];
            const quoteStart = fullMatch.indexOf(extractedText);

            const startPos = editor.document.positionAt(
              match.index + quoteStart
            );
            const endPos = editor.document.positionAt(
              match.index + quoteStart + extractedText.length
            );
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
        vscode.window.showInformationMessage(
          "No translatable strings found in the file"
        );
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Processing file translations...",
          cancellable: false,
        },
        async () => {
          try {
            console.log(baseUrl + "/file-translations");
            const response = await fetch(`${baseUrl}/file-translations`, {
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
              throw new Error(
                `HTTP error! status: ${response.status}, ${
                  response.statusText
                }, ${await response.text()}`
              );
            }

            const result = (await response.json()) as FileTranslationResponse;

            // Replace the strings in the editor with their value_keys
            await editor.edit((editBuilder) => {
              for (const position of matchPositions) {
                const translation = result.data.translations.find(
                  (t) => t.value === position.value
                );
                if (translation) {
                  if (translation.is_locked) {
                    vscode.window.showWarningMessage(
                      `Translation "${translation.value}" is locked and will be skipped.`
                    );
                    continue;
                  }
                  editBuilder.replace(
                    position.range,
                    `${result.data.file_key}.${translation.value_key}`
                  );
                }
              }
            });

            const skippedCount = result.data.metadata.locked_count;
            const totalCount = result.data.total;
            const processedCount = totalCount - skippedCount;

            vscode.window.showInformationMessage(
              `Successfully processed ${processedCount} strings${
                skippedCount > 0
                  ? ` (${skippedCount} locked translations skipped)`
                  : ""
              }`
            );
          } catch (error) {
            vscode.window.showErrorMessage(
              "Failed to process file translations"
            );
            console.error("File translation error:", error);
          }
        }
      );
    }
  );

  // Initial state check
  const existingToken = context.workspaceState.get("verblazeCliToken");
  updateStatusBarItem(!!existingToken);

  // Add commands to context
  context.subscriptions.push(
    loginCommand,
    logoutCommand,
    translateCommand,
    searchCommand,
    fileTranslationCommand
  );
}

export function deactivate() {}
