const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const pandaUtils = require('./panda-utils.js');

class ClassForRequire {

	constructor() {

		this.currentPanel = undefined
		this.pandaGUIDataPath = path.join('Assets' , '_Project', 'Resources', '_System', 'pandagui-data.json')
		this.currentWorkspaceFolder = this.getProjectRoot()
		this.pandaGUIData = require(path.join(this.currentWorkspaceFolder, this.pandaGUIDataPath))
		this.gamepacksToBeLoaded = this.setGamepacksToBeLoadedArray()
		this.cinematicsFolderPath = path.join(
			'Assets' , '_Project', 'Resources', 'Gamepacks', this.gamepacksToBeLoaded[0], 'Cinematics')
		this.charactersFolderPath = path.join(
			'Assets' , '_Project', 'Resources', 'Gamepacks', this.gamepacksToBeLoaded[0], 'Characters')

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

	setGamepacksToBeLoadedArray () {
		let arr = [ this.pandaGUIData.activeGamepack.name ]
		this.pandaGUIData.activeGamepack.secondaryGamepacks.forEach(gamepackName => {
			arr.push(gamepackName)
		})
		arr.push('_System')

		arr.forEach(element => {
			console.log(element)
		})
		return arr
	}

	GetFileAndWebviewURIs(path) {
		// Get URI to image
		const fileDiskPath = vscode.Uri.file(path);
		// And get the special URI to use with the webview
		const fileWebviewUri = this.currentPanel.webview.asWebviewUri(fileDiskPath);
		return { fileUri: fileDiskPath, webviewUri: fileWebviewUri }
	}

	getProjectRoot () {
		return vscode.workspace.getWorkspaceFolder(
			vscode.window.activeTextEditor.document.uri).uri.fsPath;
	}
}

module.exports = new ClassForRequire()
