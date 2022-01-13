// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
//const pandaUtils = require('./panda-utils.js');
/*import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';*/

let currentPanel = undefined
let lastActiveTextEditor = null
let currentWorkspaceFolder = ''
const pandaGUIDataPath = path.join(
	'Assets' , '_Project', 'Resources', '_System', 'pandagui-data.json')
let pandaGUIData = null
let gamepacksToBeLoaded = null
let cinematicsFolderPath = ''
let charactersFolderPath = ''
let blockNextOnTextEditorSelectionEvent = false
let updateWebviewOnNextTextEditEvent = false

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
				});

				//vscode.window.activeTextEditor
				currentWorkspaceFolder = getProjectRoot()

				pandaGUIData = require(path.join(currentWorkspaceFolder, pandaGUIDataPath))
				//import * as pandaData from (path.join(currentWorkspaceFolder, pandaGUIDataPath))

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
				})

				// Event fired when changing selection in the active text editor
				vscode.window.onDidChangeTextEditorSelection(changeEvent => {
					if (blockNextOnTextEditorSelectionEvent == false) {
						if (vscode.window.activeTextEditor) {
							lastActiveTextEditor = vscode.window.activeTextEditor
						}
						OnUserChangedSelection(changeEvent)
					}
				})

				//currentPanel.webview.html = getWebviewContent('Coding Cat');

				// Handle messages from the webview
				currentPanel.webview.onDidReceiveMessage(
					message => {
						if (message.command == 'selectable-image-clicked') {
							OnSelectableImageClicked(message)
						} else if (message.command == 'rename-to-3-digits') {
							RenameFilesTo3Digits(message)
						} else if (message.command == 'effect-slider-change' && lastActiveTextEditor) {
							SetPandaParam(message.paramNumber, message.value)
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

function SetPandaParam (paramNumber, newValue) {
	let selectedLineAt = lastActiveTextEditor.selection.active.line
	let line = lastActiveTextEditor.document.lineAt(selectedLineAt);

	ReplacePandaParam(line, paramNumber, GetAsPandaFloat(newValue.toFixed(2)))

	/*switch (message.control) {
		case 'duration':
			ReplacePandaParam(line, 0, GetAsPandaFloat(message.value.toFixed(2)))
			break;
		case 'zoom':
			ReplacePandaParam(line, 1, GetAsPandaFloat(message.value.toFixed(2)))
			break;
		case 'position':
			ReplacePandaParam(line, 2, GetAsPandaFloat(message.value.toFixed(2)))
			break;
		case 'start-margin':
			ReplacePandaParam(line, 3, GetAsPandaFloat(message.value.toFixed(2)))
			break;
		case 'end-margin':
			ReplacePandaParam(line, 4, GetAsPandaFloat(message.value.toFixed(2)))
			break;
	}*/

	PlaceTextEditorCursorAtEndOfLine(selectedLineAt)
}

function PlaceTextEditorCursorAtEndOfLine(selectedLineAt) {
	let line = lastActiveTextEditor.document.lineAt(selectedLineAt);
	let pos = new vscode.Position(selectedLineAt, line.range.end)
	lastActiveTextEditor.selections = [new vscode.Selection(pos, pos)]
}

function GetAsPandaFloat(value) {
	if (String(value).indexOf('.') == -1) {
		return value + '.0'
	}
	return value
}

function ReplacePandaParam (line, paramNumber, newParam) {
	let newLine = line.text
	const paramsStart = line.text.indexOf('(')
	const paramsEnd = line.text.lastIndexOf(')')
	const command = line.text.slice(0, paramsStart)
	let params = line.text.slice(paramsStart + 1, paramsEnd).split(',')
	if (paramNumber < params.length) {
		params[paramNumber] = (paramNumber == 0 ? '' : ' ') + newParam
	} else {
		for (let i = params.length; i < paramNumber; i++) {
			params.push((paramNumber == 0 ? '' : ' ') + '0.0')
		}
		params.push((paramNumber == 0 ? '' : ' ') + newParam)
	}
	newLine = line.text.slice(0, paramsStart) + '(' + params.join(',') + line.text.slice(paramsEnd)

	blockOnTextEditorSelectionEvent = true

	lastActiveTextEditor.edit(editBuilder => {
		editBuilder.replace(line.range, newLine)
		vscode.window.activeTextEditor = lastActiveTextEditor
		vscode.window.showTextDocument(lastActiveTextEditor.document, vscode.ViewColumn.One, false)
	}).then(() => {
		setTimeout(() => {
			OnUserChangedSelection(null)
			blockOnTextEditorSelectionEvent = false
		}, 100)
	})
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

function OnUserChangedTextInDocument(changeEvent) {
	/*console.log(`Did change: ${changeEvent.document.uri}`);
		
	for (const change of changeEvent.contentChanges) {
		 console.log(change.range); // range of text being replaced
		 console.log(change.text); // text replacement
	}

	currentPanel.webview.postMessage('textChange')*/
	if (updateWebviewOnNextTextEditEvent == true) {
		OnUserChangedSelection(null)
		updateWebviewOnNextTextEditEvent = false
	}
}

function OnUserChangedSelection(changeEvent) {

	currentPanel.webview.postMessage(
		{ command: 'set-workspace-folder', workspaceFolder: currentWorkspaceFolder })

	let selectedLineAt = lastActiveTextEditor.selection.active.line
	let line = lastActiveTextEditor.document.lineAt(selectedLineAt);

	console.log(DeterminePandaOrBambooLine(line))

	if (IsCinematicImageLine(line)) {
		console.log(GetBambooLineContent(line))
		OnSelectedImageLine(selectedLineAt, line)
	} else if (IsPrintLine(line)) {
		console.log(GetBambooLineContent(line))
		OnSelectedPrintLine(selectedLineAt, line)
	} else if (IsCinematicEffectLine(line)) {
		console.log(GetPandaLineContent(line))
		OnSelectedCinematicEffectLine(selectedLineAt, line)
	} else {
		currentPanel.webview.postMessage({ command: 'set-state', state: 'none'})
		currentPanel.webview.postMessage({ command: 'no-selection' })
		return
	}
}

function IsCinematicImageLine (line) {
	return line.text.startsWith('#', line.firstNonWhitespaceCharacterIndex)
}

function IsPrintLine (line) {
	return (line.text.startsWith('0', line.firstNonWhitespaceCharacterIndex)
	|| line.text.startsWith('1', line.firstNonWhitespaceCharacterIndex) 
	|| line.text.startsWith('2', line.firstNonWhitespaceCharacterIndex) 
	|| line.text.startsWith('3', line.firstNonWhitespaceCharacterIndex) 
	|| line.text.startsWith('4', line.firstNonWhitespaceCharacterIndex) 
	|| line.text.startsWith('5', line.firstNonWhitespaceCharacterIndex))
}

function IsCinematicEffectLine (line) {
	return line.text.startsWith('Pan', line.firstNonWhitespaceCharacterIndex)
}

function OnSelectedCinematicEffectLine (selectedLineAt, line) {
	// Get next Cinematic Image
	let basePath = ''
	let imageName = null
	for (let i = selectedLineAt; i < selectedLineAt + 10; i++) {
		let lineCheckedForCinematicImage = lastActiveTextEditor.document.lineAt(i)
		if (IsCinematicImageLine(lineCheckedForCinematicImage)) {
			basePath = GetBasePath(i)
			imageName = GetImageFromCinematicImageLine(lineCheckedForCinematicImage)
			break
		}
	}

	currentPanel.webview.postMessage({ command: 'set-state', state: 'cinematic-effect-state'})

	if (imageName == null) {
		return
	}

	const effectImageWebviewUri = GetFileAndWebviewURIs(
		path.join(currentWorkspaceFolder, cinematicsFolderPath, basePath, imageName + '.jpg')).webviewUri

	const lineContent = GetPandaLineContent(line)

	currentPanel.webview.postMessage(
		{
			command: 'set-edit-effect-image',
			image: { Uri: String(effectImageWebviewUri), fileName: path.join(imageName + '.jpg') },
			lineContent: lineContent
		})
}

function GetFileAndWebviewURIs(path) {
	// Get URI to image
	const fileDiskPath = vscode.Uri.file(path);
	// And get the special URI to use with the webview
	const fileWebviewUri = currentPanel.webview.asWebviewUri(fileDiskPath);
	return { fileUri: fileDiskPath, webviewUri: fileWebviewUri }
}

function GetImageFromCinematicImageLine(line) {
	return line.text.split(':')[1].split(';')[0]
}

function GetBambooLineContent(line) {
	const lineText = line.text.trim()
	const paramsStart = lineText.indexOf(':')
	const command = lineText.slice(0, paramsStart)
	const params = lineText.slice(paramsStart + 1).split(',')
	for (let i = 0; i < params.length; i++) {
		params[i] = params[i].trim()
	}
	return {
		command: command,
		params: ParseParams(params)
	}
}

function GetPandaLineContent(line) {
	const lineText = line.text.trim()
	const paramsStart = lineText.indexOf('(')
	const paramsEnd = lineText.lastIndexOf(')')
	const command = lineText.slice(0, paramsStart)
	const params = lineText.slice(paramsStart + 1, paramsEnd).split(',')
	for (let i = 0; i < params.length; i++) {
		params[i] = params[i].trim()
	}
	return {
		command: command,
		params: ParseParams(params)
	}
}

function DeterminePandaOrBambooLine(line) {
	const pandaParamsStart = line.text.indexOf('(')
	const bambooParamsStart = line.text.indexOf(':')
	for (let i = 0; i < line.text.length; i++) {
		if (line.text[i] == '(') {
			return 'panda'
		} else if (line.text[i] == ':') {
			return 'bamboo'
		}
	}
	return 'none'
}

function ParseParams(params) {
	for (let i = 0; i < params.length; i++) {
		if (params[i].startsWith("\"") && params[i].endsWith("\"")) {
			params[i] = params[i].slice(1, params[i].length - 1)
		}
	}
	return params
}

function OnSelectedImageLine(selectedLineAt, line) {
	let lineText = line.text.trim()
	let imageName = GetImageFromCinematicImageLine(line)
	// Get basePath
	let basePath = GetBasePath(selectedLineAt)

	const currentImageWebviewUri = GetFileAndWebviewURIs(
		path.join(currentWorkspaceFolder, cinematicsFolderPath, basePath, imageName + '.jpg')).webviewUri

	var filesInFolder = fs.readdirSync(path.join(currentWorkspaceFolder, cinematicsFolderPath, basePath));
	var selectableImages = []

	filesInFolder.forEach(file => {
		if (getFileExtension(file) == 'jpg') {
			var selectableImageDiskPath = vscode.Uri.file(path.join(currentWorkspaceFolder, cinematicsFolderPath, basePath, file))
			var selectableImageWebviewUri = currentPanel.webview.asWebviewUri(selectableImageDiskPath);
			selectableImages.push( { webviewUri: String(selectableImageWebviewUri), fileName: file })
		}
	});

	currentPanel.webview.postMessage({ command: 'set-state', state: 'cinematic-select-state'})

	currentPanel.webview.postMessage(
		{
			command: 'update-current-image',
			selectedLine: lastActiveTextEditor.document.lineAt(lastActiveTextEditor.selection.active.line),
			image: { Uri: String(currentImageWebviewUri), fileName: path.join(imageName + '.jpg') }
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

	currentPanel.webview.postMessage({ command: 'set-state', state: 'portrait-select-state'})

	currentPanel.webview.postMessage(
		{
			command: 'update-current-image',
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

function getProjectRoot () {
	return vscode.workspace.getWorkspaceFolder(
	  vscode.window.activeTextEditor.document.uri
	).uri.fsPath;
}

function getFileExtension (filename) {
    return filename.substring(filename.lastIndexOf('.')+1, filename.length) || filename;
}

function removeFileExtension (str) {
	return str.substring(0, str.length - (getFileExtension(str).length + 1))
}

// this method is called when your extension is deactivated
function deactivate () {}

module.exports = {
	activate,
	deactivate
}
