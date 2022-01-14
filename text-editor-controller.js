const pandaUtils = require('./panda-utils.js')
const vscode = require('vscode')
const ext = require('./ext-controller.js')

class ClassForRequire {

	constructor() {

		this.lastActiveTextEditor = null

	}

	LineAt(lineID) {
		return this.lastActiveTextEditor.document.lineAt(lineID)
	}

	SelectedLine() {
		return this.LineAt(this.lastActiveTextEditor.selection.active.line)
	}

	SelectedLineID() {
		return this.lastActiveTextEditor.selection.active.line
	}

	SetParamOfSelectedLine (paramNumber, newValue) {
		this.SetParamOfLineAt(this.SelectedLineID(), paramNumber, newValue)
		this.PlaceTextEditorCursorAtEndOfLine(this.SelectedLineID())
	}
	
	SetParamOfLineAt (lineID, paramNumber, newValue) {
		let line = this.LineAt(lineID);
		let newLine = null
	
		if (pandaUtils.DeterminePandaOrBambooLine(line) === 'bamboo') {
			newLine = pandaUtils.ReplaceBambooParam(line, paramNumber, newValue)
		} else if (pandaUtils.DeterminePandaOrBambooLine(line) === 'panda') {
			newLine = pandaUtils.ReplacePandaParam(line, paramNumber, newValue)
		}
	
		if (newLine !== null) {
			this.ReplaceLine(line, newLine)
		}
	}
	
	ReplaceLine (line, newLine) {
		this.lastActiveTextEditor.edit(editBuilder => {
			editBuilder.replace(line.range, newLine)
			//this.vscode.window.activeTextEditor = lastActiveTextEditor
			vscode.window.showTextDocument(this.lastActiveTextEditor.document, vscode.ViewColumn.One, false)
		}).then(() => {
			setTimeout(() => {
				OnUserChangedSelection(null)
			}, 100)
		})
	}

	PlaceTextEditorCursorAtEndOfLine(selectedLineAt) {
		let line = this.lastActiveTextEditor.document.lineAt(selectedLineAt);
		let pos = new vscode.Position(selectedLineAt, line.range.end)
		this.lastActiveTextEditor.selections = [new vscode.Selection(pos, pos)]
	}
}

module.exports = new ClassForRequire()