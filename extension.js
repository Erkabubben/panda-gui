// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const pandaUtils = require('./panda-utils.js');
const ext = require('./ext-controller.js');
const textEditorController = require('./text-editor-controller.js')
const extData = require('./ext-data.js');
const fetch = require('fetch-download');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "pandagui" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json

	extData.currentPanel = vscode.WebviewPanel | undefined;

	context.subscriptions.push(
		vscode.commands.registerCommand('pandagui.pandaGUI', () => {
			const columnToShowIn = vscode.window.activeTextEditor
				? vscode.ViewColumn.Two
				: vscode.ViewColumn.One
				//: vscode.window.activeTextEditor.viewColumn;

			if (extData.currentPanel) {
				// If we already have a panel, show it in the target column
				extData.currentPanel.reveal(columnToShowIn);
			} else {
				// Otherwise, create a new panel
				extData.currentPanel = vscode.window.createWebviewPanel(
				'catCoding',
				'PandaGUI',
				columnToShowIn,
				{
					// Enable scripts in the webview
					enableScripts: true
				});

				// Get path to resource on disk
				const onDiskPath = vscode.Uri.file(
					path.join(context.extensionPath, 'src', 'components', 'panda-gui', 'index.js')
				);
		
				// And get the special URI to use with the webview
				const scriptWebviewUri = extData.currentPanel.webview.asWebviewUri(onDiskPath);

				extData.currentPanel.webview.html = customComponentContent(scriptWebviewUri)

				// Event fired on changes to the active text editor
				vscode.workspace.onDidChangeTextDocument(changeEvent => {
					OnUserChangedTextInDocument(changeEvent)
				})

				// Event fired when changing selection in the active text editor
				vscode.window.onDidChangeTextEditorSelection(changeEvent => {
					if (vscode.window.activeTextEditor) {
						textEditorController.lastActiveTextEditor = vscode.window.activeTextEditor;
					}
					ext.OnUserChangedSelection(changeEvent)
				})

				//currentPanel.webview.html = getWebviewContent('Coding Cat');

				// Handle messages from the webview
				extData.currentPanel.webview.onDidReceiveMessage(
					message => {
						for (const [key, value] of Object.entries(ext.lineEditors)) {
							value.OnMessage(message)
						}
						/*if (message.command == 'selectable-image-clicked') {
							ext.OnSelectableImageClicked(message)
						} else if (message.command == 'rename-to-3-digits') {
							ext.RenameFilesTo3Digits(message)
						} else if (message.command == 'effect-slider-change' && textEditorController.lastActiveTextEditor) {
							textEditorController.SetParamOfSelectedLine(message.paramNumber, pandaUtils.GetAsPandaFloat(message.value.toFixed(2)))
						}*/
						setTimeout(() => {
							ext.OnUserChangedSelection(null)
						}, 100)
					},
					undefined,
					context.subscriptions
				)

				// Reset when the current panel is closed
				extData.currentPanel.onDidDispose(
				() => {
					//if (vscode.window.activeTextEditor.)
					extData.currentPanel = undefined;
				},
				null,
				context.subscriptions
				);
			}
		})
	);
}

function OnUserChangedTextInDocument (changeEvent) {
	/*console.log(`Did change: ${changeEvent.document.uri}`);
		
	for (const change of changeEvent.contentChanges) {
		 console.log(change.range); // range of text being replaced
		 console.log(change.text); // text replacement
	}

	currentPanel.webview.postMessage('textChange')*/
}

function customComponentContent (scriptWebviewUri) {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>PandaGUI</title>
	  <script type="module" src="${scriptWebviewUri}"></script>
  </head>
  <body>
	<panda-gui></panda-gui>
  </body>
  </html>`;
}

// this method is called when your extension is deactivated
function deactivate () {}

module.exports = {
	activate,
	deactivate
}
