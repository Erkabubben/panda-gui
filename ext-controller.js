const fs = require('fs');
const path = require('path');
const pandaUtils = require('./panda-utils.js');
const vscode = require('vscode');
const textEditorController = require('./text-editor-controller.js')

class ClassForRequire {

	constructor() {

		this.currentPanel = undefined
		this.currentWorkspaceFolder = ''
		this.pandaGUIDataPath = path.join('Assets' , '_Project', 'Resources', '_System', 'pandagui-data.json')
		this.pandaGUIData = null
		this.gamepacksToBeLoaded = null
		this.cinematicsFolderPath = ''
		this.charactersFolderPath = ''
		this.updateWebviewOnNextTextEditEvent = false

	}

	OnSelectableImageClicked (message) {
		if (textEditorController.lastActiveTextEditor == null) {
			console.log('NO EDITOR FOUND');
			return;
		}
	
		let selectedLineAt = textEditorController.lastActiveTextEditor.selection.active.line
		let line = textEditorController.lastActiveTextEditor.document.lineAt(selectedLineAt);
		let newLine = line.text;
	
		if (message.imageType == 'cinematic') {
			const delimiter = ':'
			let parts = newLine.split(delimiter)
			parts[1] = this.removeFileExtension(message.text)
			newLine = parts.join(delimiter);
	
			textEditorController.ReplaceLine(line, newLine)
			/*textEditorController.SetParamOfSelectedLine(0, this.removeFileExtension(message.text))*/
		} else if (message.imageType == 'portrait') {
			const imageName = this.removeFileExtension(message.text)
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
	
			textEditorController.ReplaceLine(line, newLine)
		}
	
		setTimeout(() => {
			this.OnUserChangedSelection(null)
		}, 100)
	}

	RenameFilesTo3Digits (message) {
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

	SavePandaGUIData () {
		let data = {
			activeGamepack: {
				name: 'May2021Demo',
				secondaryGamepacks: ['NewCranesridge', 'TestCommon']
			},
			playerCharacter: 'sara-simsek'
		}

		let jsonData = JSON.stringify(data);

		fs.writeFile(path.join(this.currentWorkspaceFolder, this.pandaGUIDataPath), jsonData, function(err) {
			if (err) {
				console.log(err);
			}
		})
	}

	OnUserChangedSelection (changeEvent) {

		this.currentPanel.webview.postMessage(
			{ command: 'set-workspace-folder', workspaceFolder: this.currentWorkspaceFolder })
	
		let selectedLineAt = textEditorController.lastActiveTextEditor.selection.active.line
		let line = textEditorController.lastActiveTextEditor.document.lineAt(selectedLineAt);
	
		//console.log(pandaUtils.DeterminePandaOrBambooLine(line))
	
		if (this.IsCinematicImageLine(line)) {
			console.log(pandaUtils.GetBambooLineContent(line))
			this.OnSelectedImageLine(selectedLineAt, line)
		} else if (this.IsPrintLine(line)) {
			console.log(pandaUtils.GetBambooLineContent(line))
			this.OnSelectedPrintLine(selectedLineAt, line)
		} else if (this.IsCinematicEffectLine(line)) {
			console.log(pandaUtils.GetPandaLineContent(line))
			this.OnSelectedCinematicEffectLine(selectedLineAt, line)
		} else {
			this.currentPanel.webview.postMessage({ command: 'set-state', state: 'none'})
			this.currentPanel.webview.postMessage({ command: 'no-selection' })
			return
		}
	}
	
	IsCinematicImageLine (line) {
		return line.text.startsWith('#', line.firstNonWhitespaceCharacterIndex)
	}
	
	IsPrintLine (line) {
		return (line.text.startsWith('0', line.firstNonWhitespaceCharacterIndex)
		|| line.text.startsWith('1', line.firstNonWhitespaceCharacterIndex) 
		|| line.text.startsWith('2', line.firstNonWhitespaceCharacterIndex) 
		|| line.text.startsWith('3', line.firstNonWhitespaceCharacterIndex) 
		|| line.text.startsWith('4', line.firstNonWhitespaceCharacterIndex) 
		|| line.text.startsWith('5', line.firstNonWhitespaceCharacterIndex))
	}
	
	IsCinematicEffectLine (line) {
		return line.text.startsWith('Camera', line.firstNonWhitespaceCharacterIndex)
	}
	
	OnSelectedCinematicEffectLine (selectedLineAt, line) {
		// Get next Cinematic Image
		let basePath = ''
		let imageName = null
		for (let i = selectedLineAt; i < selectedLineAt + 10; i++) {
			let lineCheckedForCinematicImage = textEditorController.lastActiveTextEditor.document.lineAt(i)
			if (this.IsCinematicImageLine(lineCheckedForCinematicImage)) {
				basePath = pandaUtils.GetBasePath(textEditorController.lastActiveTextEditor, i)
				imageName = pandaUtils.GetImageFromCinematicImageLine(lineCheckedForCinematicImage)
				break
			}
		}
	
		this.currentPanel.webview.postMessage({ command: 'set-state', state: 'cinematic-effect-state'})
	
		if (imageName == null) {
			return
		}
	
		const effectImageWebviewUri = this.GetFileAndWebviewURIs(
			path.join(this.currentWorkspaceFolder, this.cinematicsFolderPath, basePath, imageName + '.jpg')).webviewUri
	
		const lineContent = pandaUtils.GetPandaLineContent(line)
	
		this.currentPanel.webview.postMessage(
			{
				command: 'set-edit-effect-image',
				image: { Uri: String(effectImageWebviewUri), fileName: path.join(imageName + '.jpg') },
				lineContent: lineContent
			})
	}
	
	GetFileAndWebviewURIs(path) {
		// Get URI to image
		const fileDiskPath = vscode.Uri.file(path);
		// And get the special URI to use with the webview
		const fileWebviewUri = this.currentPanel.webview.asWebviewUri(fileDiskPath);
		return { fileUri: fileDiskPath, webviewUri: fileWebviewUri }
	}
	
	OnSelectedImageLine(selectedLineAt, line) {
		let lineText = line.text.trim()
		let imageName = pandaUtils.GetImageFromCinematicImageLine(line)
		// Get basePath
		let basePath = pandaUtils.GetBasePath(textEditorController.lastActiveTextEditor, selectedLineAt)
	
		const currentImageWebviewUri = this.GetFileAndWebviewURIs(
			path.join(this.currentWorkspaceFolder, this.cinematicsFolderPath, basePath, imageName + '.jpg')).webviewUri
	
		var filesInFolder = fs.readdirSync(path.join(this.currentWorkspaceFolder, this.cinematicsFolderPath, basePath));
		var selectableImages = []
	
		filesInFolder.forEach(file => {
			if (this.getFileExtension(file) == 'jpg') {
				var selectableImageDiskPath = vscode.Uri.file(path.join(this.currentWorkspaceFolder, this.cinematicsFolderPath, basePath, file))
				var selectableImageWebviewUri = this.currentPanel.webview.asWebviewUri(selectableImageDiskPath);
				selectableImages.push( { webviewUri: String(selectableImageWebviewUri), fileName: file })
			}
		});
	
		this.currentPanel.webview.postMessage({ command: 'set-state', state: 'cinematic-select-state'})
	
		this.currentPanel.webview.postMessage(
			{
				command: 'update-current-image',
				selectedLine: textEditorController.SelectedLine(),
				image: { Uri: String(currentImageWebviewUri), fileName: path.join(imageName + '.jpg') }
			})
	
		this.currentPanel.webview.postMessage(
			{
				command: 'update-selectable-images',
				selectableImages: selectableImages,
				basePath: basePath,
				imageType: 'cinematic'
			})	
	}
	
	OnSelectedPrintLine (selectedLineAt, line) {
		let lineText = line.text.trim()
		let participants = pandaUtils.GetParticipants(textEditorController.lastActiveTextEditor, this.pandaGUIData, selectedLineAt)
		if (participants == null || participants.length == 0)
			return
	
		let speaker = participants[lineText[0]]
		console.log(speaker + " is speaking now.")
	
		const portrait = pandaUtils.GetPortraitOfPrintLine(textEditorController.lastActiveTextEditor, selectedLineAt)
	
		// Get URI to image
		const imageDiskPath = vscode.Uri.file(
			path.join(this.currentWorkspaceFolder, this.charactersFolderPath, speaker, portrait + '.png')
		);
	
		// And get the special URI to use with the webview
		const imageWebviewUri = this.currentPanel.webview.asWebviewUri(imageDiskPath);
	
		var filesInFolder = fs.readdirSync(path.join(this.currentWorkspaceFolder, this.charactersFolderPath, speaker));
		var selectableImages = []
	
		filesInFolder.forEach(file => {
			if (this.getFileExtension(file) == 'png') {
				var selectableImageDiskPath = vscode.Uri.file(path.join(this.currentWorkspaceFolder, this.charactersFolderPath, speaker, file))
				var selectableImageWebviewUri = this.currentPanel.webview.asWebviewUri(selectableImageDiskPath);
				selectableImages.push( { webviewUri: String(selectableImageWebviewUri), fileName: file })
			}
		})
	
		this.currentPanel.webview.postMessage({ command: 'set-state', state: 'portrait-select-state'})
	
		this.currentPanel.webview.postMessage(
			{
				command: 'update-current-image',
				selectedLine: textEditorController.SelectedLine(),
				image: { Uri: portrait != "" ? String(imageWebviewUri) : "", fileName: portrait + '.png' }
			})
	
		this.currentPanel.webview.postMessage(
			{
				command: 'update-selectable-images',
				selectableImages: selectableImages,
				basePath: '',
				imageType: 'portrait'
			})	
	}

	getProjectRoot () {
		return vscode.workspace.getWorkspaceFolder(
			vscode.window.activeTextEditor.document.uri).uri.fsPath;
	}

	getFileExtension (filename) {
		return filename.substring(filename.lastIndexOf('.')+1, filename.length) || filename;
	}

	removeFileExtension (str) {
		return str.substring(0, str.length - (this.getFileExtension(str).length + 1))
	}
}

module.exports = new ClassForRequire()
