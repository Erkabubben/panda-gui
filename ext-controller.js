const fs = require('fs');
const path = require('path');
const pandaUtils = require('./panda-utils.js');
const vscode = require('vscode');
const textEditorController = require('./text-editor-controller.js')
const lineEditor = require('./line-editor.js');
const extData = require('./ext-data.js');
const utils = require('./utils.js');

class ClassForRequire {

	constructor() {

		this.lineEditors = {
			imageSelector: new lineEditor.ImageSelector(),
			effectEditor: new lineEditor.EffectEditor(),
			fileOperations: new lineEditor.FileOperations()
		}

	}

	OnUserChangedSelection (changeEvent) {

		extData.currentPanel.webview.postMessage(
			{ command: 'set-workspace-folder', workspaceFolder: extData.currentWorkspaceFolder })
	
		let selectedLineAt = textEditorController.SelectedLineID()
		let line = textEditorController.SelectedLine();

		if (this.lineEditors.imageSelector.IsCinematicImageLine(line)) {
			this.lineEditors.imageSelector.OnSelectedImageLine(selectedLineAt, line)
		} else if (this.lineEditors.imageSelector.IsPrintLine(line)) {
			this.lineEditors.imageSelector.OnSelectedPrintLine(selectedLineAt, line)
		} else if (this.lineEditors.imageSelector.IsCinematicEffectLine(line)) {
			this.lineEditors.effectEditor.OnSelectedCinematicEffectLine(selectedLineAt, line)
		} else {
			extData.currentPanel.webview.postMessage({ command: 'set-state', state: 'none'})
			extData.currentPanel.webview.postMessage({ command: 'no-selection' })
			return
		}
	}
}

module.exports = new ClassForRequire()
