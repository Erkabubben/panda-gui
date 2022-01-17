const fs = require('fs');
const path = require('path')
const pandaUtils = require('./panda-utils.js')
const vscode = require('vscode')
const textEditorController = require('./text-editor-controller.js')
const extData = require('./ext-data.js')
const utils = require('./utils.js')

class PandaEditor {

	constructor() {}

}

module.exports.FileOperations = class FileOperations extends PandaEditor {

	constructor() {
		super()
	}

	Init () {}

	OnMessage(message) {
		if (message.command == 'rename-to-3-digits') {
			this.RenameFilesTo3Digits(message)
		}
	}

	RenameFilesTo3Digits (message) {
		let currentNumber = 1
		for(let i = 0; i < message.files.length; i++) {
			const originalPath = message.files[i]
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
}

class LineEditor extends PandaEditor {

	constructor() {
		super()
	}

	Init () {}

	OnMessage(message) {}

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
}

module.exports.ImageSelector = class ImageSelector extends LineEditor {

	constructor() {
		super()
	}

	Init () {

	}

	OnMessage(message) {
		if (message.command == 'selectable-image-clicked') {
			this.OnSelectableImageClicked(message)
		}
	}

	OnSelectedImageLine(selectedLineAt, line) {
		let imageName = pandaUtils.GetPartsOfLine(line, 'bamboo').params[0]
		// Get basePath
		let basePath = pandaUtils.GetBasePath(textEditorController.lastActiveTextEditor, selectedLineAt)
	
		const currentImageWebviewUri = extData.GetFileAndWebviewURIs(
			path.join(extData.currentWorkspaceFolder, extData.cinematicsFolderPath, basePath, imageName + '.jpg')).webviewUri
	
		var filesInFolder = fs.readdirSync(path.join(extData.currentWorkspaceFolder, extData.cinematicsFolderPath, basePath));
		var selectableImages = []
	
		filesInFolder.forEach(file => {
			if (utils.getFileExtension(file) == 'jpg') {
				var selectableImageDiskPath = vscode.Uri.file(path.join(extData.currentWorkspaceFolder, extData.cinematicsFolderPath, basePath, file))
				var selectableImageWebviewUri = extData.currentPanel.webview.asWebviewUri(selectableImageDiskPath);
				selectableImages.push( { webviewUri: String(selectableImageWebviewUri), fileName: file })
			}
		});
	
		extData.currentPanel.webview.postMessage({ command: 'set-state', state: 'cinematic-select-state'})
	
		extData.currentPanel.webview.postMessage(
			{
				command: 'update-current-image',
				selectedLine: textEditorController.SelectedLine(),
				image: { Uri: String(currentImageWebviewUri), fileName: path.join(imageName + '.jpg') }
			})
	
		extData.currentPanel.webview.postMessage(
			{
				command: 'update-selectable-images',
				selectableImages: selectableImages,
				basePath: basePath,
				imageType: 'cinematic'
			})	
	}
	
	OnSelectedPrintLine (selectedLineAt, line) {
		let lineText = line.text.trim()
		let participants = pandaUtils.GetParticipants(textEditorController.lastActiveTextEditor, extData.pandaGUIData, selectedLineAt)
		if (participants == null || participants.length == 0)
			return
	
		let speaker = participants[lineText[0]]
		console.log(speaker + " is speaking now.")
	
		const portrait = pandaUtils.GetPortraitOfPrintLine(textEditorController.lastActiveTextEditor, selectedLineAt)
	
		// Get URI to image
		const imageDiskPath = vscode.Uri.file(
			path.join(extData.currentWorkspaceFolder, extData.charactersFolderPath, speaker, portrait + '.png')
		);
	
		// And get the special URI to use with the webview
		const imageWebviewUri = extData.currentPanel.webview.asWebviewUri(imageDiskPath);
	
		var filesInFolder = fs.readdirSync(path.join(extData.currentWorkspaceFolder, extData.charactersFolderPath, speaker));
		var selectableImages = []
	
		filesInFolder.forEach(file => {
			if (utils.getFileExtension(file) == 'png') {
				var selectableImageDiskPath = vscode.Uri.file(path.join(extData.currentWorkspaceFolder, extData.charactersFolderPath, speaker, file))
				var selectableImageWebviewUri = extData.currentPanel.webview.asWebviewUri(selectableImageDiskPath);
				selectableImages.push( { webviewUri: String(selectableImageWebviewUri), fileName: file })
			}
		})
	
		extData.currentPanel.webview.postMessage({ command: 'set-state', state: 'portrait-select-state'})
	
		extData.currentPanel.webview.postMessage(
			{
				command: 'update-current-image',
				selectedLine: textEditorController.SelectedLine(),
				image: { Uri: portrait != "" ? String(imageWebviewUri) : "", fileName: portrait + '.png' }
			})
	
		extData.currentPanel.webview.postMessage(
			{
				command: 'update-selectable-images',
				selectableImages: selectableImages,
				basePath: '',
				imageType: 'portrait'
			})
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
			textEditorController.SetParamOfSelectedLine(0, utils.removeFileExtension(message.text))
		} else if (message.imageType == 'portrait') {
			const imageName = utils.removeFileExtension(message.text)
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
	}
}

module.exports.EffectEditor = class EffectEditor extends LineEditor {

	constructor() {
		super()
	}

	Init () {

	}

	OnMessage(message) {
		if (message.command == 'effect-slider-change' && textEditorController.lastActiveTextEditor) {
			textEditorController.SetParamOfSelectedLine(message.paramNumber, pandaUtils.GetAsPandaFloat(message.value.toFixed(2)))
			//const partsOfLine = pandaUtils.GetPartsOfLine(textEditorController.SelectedLine(), 'panda')
		}
	}

	OnSelectedCinematicEffectLine (selectedLineAt, line) {
		// Get next Cinematic Image
		let basePath = ''
		let imageName = null
		for (let i = selectedLineAt; i < selectedLineAt + 10; i++) {
			let lineCheckedForCinematicImage = textEditorController.LineAt(i)
			if (this.IsCinematicImageLine(lineCheckedForCinematicImage)) {
				basePath = pandaUtils.GetBasePath(textEditorController.lastActiveTextEditor, i)
				imageName = pandaUtils.GetPartsOfLine(lineCheckedForCinematicImage, 'bamboo').params[0]
				break
			}
		}
	
		extData.currentPanel.webview.postMessage({ command: 'set-state', state: 'cinematic-effect-state'})
	
		if (imageName == null) {
			return
		}
	
		const effectImageWebviewUri = extData.GetFileAndWebviewURIs(
			path.join(extData.currentWorkspaceFolder, extData.cinematicsFolderPath, basePath, imageName + '.jpg')).webviewUri
	
		const lineContent = pandaUtils.GetPartsOfLine(line, 'panda')
	
		extData.currentPanel.webview.postMessage({
			command: 'set-edit-effect-image',
			image: { Uri: String(effectImageWebviewUri), fileName: path.join(imageName + '.jpg') },
			lineContent: lineContent
		})
	}
}

//module.exports = new ClassForRequire()