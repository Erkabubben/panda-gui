// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
//import * as vscode from 'vscode';
//import * as path from 'path';

let currentPanel = undefined
let lastActiveTextEditor = null
let currentWorkspaceFolder = ''
const pandaGUIDataPath = path.join(
	'Assets' , '_Project', 'Resources', '_System', 'pandagui-data.json')
let pandaGUIData = null
let gamepacksToBeLoaded = null
let cinematicsFolderPath = ''
let charactersFolderPath = ''

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

	currentPanel = vscode.WebviewPanel | undefined;

	context.subscriptions.push(
		vscode.commands.registerCommand('pandagui.pandaGUI', () => {
			const columnToShowIn = vscode.window.activeTextEditor
				? vscode.ViewColumn.Two
				: vscode.ViewColumn.One
				//: vscode.window.activeTextEditor.viewColumn;

			if (currentPanel) {
				// If we already have a panel, show it in the target column
				currentPanel.reveal(columnToShowIn);
			} else {
				// Otherwise, create a new panel
				currentPanel = vscode.window.createWebviewPanel(
				'catCoding',
				'PandaGUI',
				columnToShowIn,
				{
					// Enable scripts in the webview
					enableScripts: true
				}
			);

			//vscode.window.activeTextEditor
			currentWorkspaceFolder = getProjectRoot()

			pandaGUIData = require(path.join(currentWorkspaceFolder, pandaGUIDataPath))
			gamepacksToBeLoaded = setGamepacksToBeLoadedArray()
			cinematicsFolderPath = path.join(
				'Assets' , '_Project', 'Resources', 'Gamepacks', gamepacksToBeLoaded[0], 'Cinematics')
			charactersFolderPath = path.join(
				'Assets' , '_Project', 'Resources', 'Gamepacks', gamepacksToBeLoaded[0], 'Characters')

			//gamepacksToBeLoaded = setGamepacksToBeLoadedArray()

			// Get path to resource on disk
			const onDiskPath = vscode.Uri.file(
				path.join(context.extensionPath, 'src', 'components', 'panda-gui', 'index.js')
			);
	
			// And get the special URI to use with the webview
			const scriptWebviewUri = currentPanel.webview.asWebviewUri(onDiskPath);

			currentPanel.webview.html = customComponentContent(scriptWebviewUri)

			// Event fired on changes to the active text editor
			vscode.workspace.onDidChangeTextDocument(changeEvent => {
				OnUserChangedTextInDocument(changeEvent)
			});

			// Event fired when changing selection in the active text editor
			vscode.window.onDidChangeTextEditorSelection(changeEvent => {
				lastActiveTextEditor = vscode.window.activeTextEditor
				OnUserChangedSelection(changeEvent)
			});

			//currentPanel.webview.html = getWebviewContent('Coding Cat');

			// Handle messages from the webview
			currentPanel.webview.onDidReceiveMessage(
				message => {
					if (message.command == 'selectable-image-clicked') {
						OnSelectableImageClicked(message)
					}
					else if (message.command == 'rename-to-3-digits') {
						RenameFilesTo3Digits(message)
					}
				},
				undefined,
				context.subscriptions
			);

			// Reset when the current panel is closed
			currentPanel.onDidDispose(
			() => {
				//if (vscode.window.activeTextEditor.)
				currentPanel = undefined;
			},
			null,
			context.subscriptions
			);
		}
		})
	);
}

function RenameFilesTo3Digits (message) {
	let currentNumber = 1
	for(let i = 0; i < message.files.length; i++) {
		originalPath = message.files[i]
		if (path.extname(originalPath) == '.jpg' || path.extname(originalPath) == '.png') {
			let newPath = path.join(path.dirname(originalPath), currentNumber.toString().padStart(3, '0') + path.extname(originalPath))
			fs.rename(originalPath, newPath, function(err) {
			  if (err) console.log('ERROR: ' + err)
			})
			// Check if a meta file exists in the folder and rename that as well
			let originalMetaFilePath = originalPath + '.meta'
			try {
				let newMetaFilePath = newPath + '.meta'
				if (fs.existsSync(originalMetaFilePath)) {
					fs.rename(originalMetaFilePath, newMetaFilePath, function(err) {
						if (err) console.log('ERROR: ' + err)
					  })
				}
			} catch(err) {
				console.error(err)
			}
			currentNumber++
		}
	}
}

function setGamepacksToBeLoadedArray () {
	let arr = [ pandaGUIData.activeGamepack.name ]
	pandaGUIData.activeGamepack.secondaryGamepacks.forEach(gamepackName => {
		arr.push(gamepackName)
	})
	arr.push('_System')

	arr.forEach(element => {
		console.log(element)
	})
	return arr
}

function savePandaGUIData () {
	let data = {
		activeGamepack: {
			name: 'May2021Demo',
			secondaryGamepacks: ['NewCranesridge', 'TestCommon']
		},
		playerCharacter: 'sara-simsek'
	}

	let jsonData = JSON.stringify(data);

	fs.writeFile(path.join(currentWorkspaceFolder, pandaGUIDataPath), jsonData, function(err) {
		if (err) {
			console.log(err);
		}
	})
}

function OnSelectableImageClicked (message) {
	switch (message.command) {
		case 'selectable-image-clicked':
			const editor = lastActiveTextEditor
			if (editor == null) {
				console.log('NO EDITOR FOUND');
				return;
			}

			let selectedLineAt = lastActiveTextEditor.selection.active.line
			let line = lastActiveTextEditor.document.lineAt(selectedLineAt);
			let newLine = line.text;

			if (message.imageType == 'cinematic') {
				const delimiter = ':'
				let parts = newLine.split(delimiter)
				parts[1] = removeFileExtension(message.text)
				newLine = parts.join(delimiter);
	
				editor.edit(editBuilder => {
					editBuilder.replace(line.range, newLine);
				});
			} else if (message.imageType == 'portrait') {
				const imageName = removeFileExtension(message.text)
				const startDelimiter = '['
				const endDelimiter = ']'
				let testTagStartIndex = newLine.indexOf(startDelimiter)
				let tagEndIndex = newLine.indexOf(endDelimiter)
				if (testTagStartIndex > -1 &&
					(line.text[testTagStartIndex + 1] >= '0' && line.text[testTagStartIndex + 1] <= '9'))
				{
					testTagStartIndex = line.text.indexOf(':') + 1
					tagEndIndex = -1
				}
				let tagStartIndex = testTagStartIndex
				if (tagStartIndex > -1 && tagEndIndex > -1) {
					let partBeforeTag = newLine.slice(0, tagStartIndex + 1)
					let partAfterTag = newLine.slice(tagEndIndex)
					newLine = partBeforeTag + imageName + partAfterTag
				} else {
					newLine = newLine.slice(0, newLine.indexOf(':') + 1)
                    + (startDelimiter + imageName + endDelimiter)
                    + newLine.slice(newLine.indexOf(':') + 1);
				}

				editor.edit(editBuilder => {
					editBuilder.replace(line.range, newLine);
				});
			}

			vscode.window.activeTextEditor = lastActiveTextEditor

			vscode.window.showTextDocument(lastActiveTextEditor.document, vscode.ViewColumn.One, false);
			
			setTimeout(() => { OnUserChangedSelection(null) }, 100);
			
			return;
		}
}

function OnUserChangedTextInDocument(changeEvent) {
	console.log(`Did change: ${changeEvent.document.uri}`);
		
	for (const change of changeEvent.contentChanges) {
		 console.log(change.range); // range of text being replaced
		 console.log(change.text); // text replacement
	}

	currentPanel.webview.postMessage('textChange')
}

function OnUserChangedSelection(changeEvent) {

	currentPanel.webview.postMessage(
		{ command: 'set-workspace-folder', workspaceFolder: currentWorkspaceFolder })

	let selectedLineAt = lastActiveTextEditor.selection.active.line
	let line = lastActiveTextEditor.document.lineAt(selectedLineAt);

	if (line.text.startsWith('#', line.firstNonWhitespaceCharacterIndex)) {
		OnSelectedImageLine(selectedLineAt, line)
	} else if (line.text.startsWith('0', line.firstNonWhitespaceCharacterIndex)
		|| line.text.startsWith('1', line.firstNonWhitespaceCharacterIndex) 
		|| line.text.startsWith('2', line.firstNonWhitespaceCharacterIndex) 
		|| line.text.startsWith('3', line.firstNonWhitespaceCharacterIndex) 
		|| line.text.startsWith('4', line.firstNonWhitespaceCharacterIndex) 
		|| line.text.startsWith('5', line.firstNonWhitespaceCharacterIndex)) {
		OnSelectedPrintLine(selectedLineAt, line)
	} else {
		currentPanel.webview.postMessage({ command: 'no-selection' })
		return
	}
}

function OnSelectedImageLine(selectedLineAt, line) {
	let lineText = line.text.trim()
	let imageName = ""
	imageName = line.text.split(':')[1].split(';')[0]
	// Get basePath
	let basePath = GetBasePath(selectedLineAt)

	// Get URI to image
	const imageDiskPath = vscode.Uri.file(
		path.join(currentWorkspaceFolder, cinematicsFolderPath, basePath, imageName + '.jpg')
	);

	// And get the special URI to use with the webview
	const imageWebviewUri = currentPanel.webview.asWebviewUri(imageDiskPath);

	var filesInFolder = fs.readdirSync(path.join(currentWorkspaceFolder, cinematicsFolderPath, basePath));
	var selectableImages = []

	filesInFolder.forEach(file => {
		if (getFileExtension(file) == 'jpg') {
			var selectableImageDiskPath = vscode.Uri.file(path.join(currentWorkspaceFolder, cinematicsFolderPath, basePath, file))
			var selectableImageWebviewUri = currentPanel.webview.asWebviewUri(selectableImageDiskPath);
			selectableImages.push( { webviewUri: String(selectableImageWebviewUri), fileName: file })
		}
	});

	currentPanel.webview.postMessage(
		{
			command: 'changed-selection',
			selectedLine: lastActiveTextEditor.document.lineAt(lastActiveTextEditor.selection.active.line),
			image: { Uri: String(imageWebviewUri), fileName: path.join(imageName + '.jpg') }
		})

	currentPanel.webview.postMessage(
		{
			command: 'update-selectable-images',
			selectableImages: selectableImages,
			basePath: basePath,
			imageType: 'cinematic'
		})	
}

function OnSelectedPrintLine (selectedLineAt, line) {
	let lineText = line.text.trim()
	let participants = GetParticipants(selectedLineAt)
	if (participants == null || participants.length == 0)
		return

	let speaker = participants[lineText[0]]
	console.log(speaker + " is speaking now.")

	const portrait = GetPortraitOfPrintLine(selectedLineAt)

	// Get URI to image
	const imageDiskPath = vscode.Uri.file(
		path.join(currentWorkspaceFolder, charactersFolderPath, speaker, portrait + '.png')
	);

	// And get the special URI to use with the webview
	const imageWebviewUri = currentPanel.webview.asWebviewUri(imageDiskPath);

	var filesInFolder = fs.readdirSync(path.join(currentWorkspaceFolder, charactersFolderPath, speaker));
	var selectableImages = []

	filesInFolder.forEach(file => {
		if (getFileExtension(file) == 'png') {
			var selectableImageDiskPath = vscode.Uri.file(path.join(currentWorkspaceFolder, charactersFolderPath, speaker, file))
			var selectableImageWebviewUri = currentPanel.webview.asWebviewUri(selectableImageDiskPath);
			selectableImages.push( { webviewUri: String(selectableImageWebviewUri), fileName: file })
		}
	})

	currentPanel.webview.postMessage(
		{
			command: 'changed-selection',
			selectedLine: lastActiveTextEditor.document.lineAt(lastActiveTextEditor.selection.active.line),
			image: { Uri: portrait != "" ? String(imageWebviewUri) : "", fileName: portrait + '.png' }
		})

	currentPanel.webview.postMessage(
		{
			command: 'update-selectable-images',
			selectableImages: selectableImages,
			basePath: '',
			imageType: 'portrait'
		})	
}

function GetBasePath (lineNumber) {
	const line = GetFirstLineAboveStartingWith(lineNumber, '#path:')
	return line != null ? line.text.split(':')[1].trim() : ""
}

function GetParticipants (lineNumber) {
	const playerCharacter = pandaGUIData.playerCharacter
	const line = GetFirstLineAboveStartingWith(lineNumber, 'SetParticipants(')
	let participants = line != null ? line.text.split('"')[1].trim().split(',') : null

	if (participants == null) {
		return null
	}

	for (let index = 0; index < participants.length; index++) {
		participants[index] = participants[index].replace(' ', '-').toLowerCase()
		if (participants[index] == 'player'
			|| participants[index] == 'playeronly'
			|| participants[index] == 'player-only') {
			participants[index] = playerCharacter
		}
	}

	if (participants[0] == "none") {
		return null;
	}

	if (participants[0] != playerCharacter) {
		participants.splice(0, 0, playerCharacter)
	}

	return participants
}

function GetPortraitOfPrintLine (lineNumber) {
	const line = lastActiveTextEditor.document.lineAt(lineNumber);
	const startDelimiter = '['
	const endDelimiter = ']'
	let testTagStartIndex = line.text.indexOf(startDelimiter)
	let tagEndIndex = line.text.indexOf(endDelimiter)
	if (testTagStartIndex > -1 &&
		(line.text[testTagStartIndex + 1] >= '0' && line.text[testTagStartIndex + 1] <= '9'))
	{
		testTagStartIndex = line.text.indexOf(':') + 1
		tagEndIndex = -1
	}
	let tagStartIndex = testTagStartIndex
	if (tagStartIndex > -1 && tagEndIndex > -1) {
		let portrait = line.text.slice(tagStartIndex + 1, tagEndIndex)
		return portrait
	}
	return ""
}

function GetParticipantCharacterNames (participants) {}

function GetFirstLineAboveStartingWith (lineNumber, startsWith) {
	var document = lastActiveTextEditor.document
	for (let index = lineNumber; index >= 0; index--) {
		if (document.lineAt(index).text.startsWith(
			startsWith, document.lineAt(index).firstNonWhitespaceCharacterIndex)) {
				console.log('Line found at ' + index + ', ' + document.lineAt(index))
				return document.lineAt(index)
			}
	}
	return null
}

function customComponentContent(scriptWebviewUri) {
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

function getProjectRoot() {
	return vscode.workspace.getWorkspaceFolder(
	  vscode.window.activeTextEditor.document.uri
	).uri.fsPath;
}

function getFileExtension(filename) {
    return filename.substring(filename.lastIndexOf('.')+1, filename.length) || filename;
}

function removeFileExtension (str) {
	return str.substring(0, str.length - (getFileExtension(str).length + 1))
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}