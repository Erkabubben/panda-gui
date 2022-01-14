const pandaUtils = require('./panda-utils.js');
const vscode = require('vscode');

class ClassForRequire {

	constructor() {

		this.lastActiveTextEditor = null

	}

	SetParamOfSelectedLine (paramNumber, newValue) {
		console.log()
		let selectedLineAt = this.lastActiveTextEditor.selection.active.line
		this.SetParamOfLineAt(selectedLineAt, paramNumber, newValue)
		this.PlaceTextEditorCursorAtEndOfLine(selectedLineAt)
	}
	
	SetParamOfLineAt (lineAt, paramNumber, newValue) {
		let line = this.lastActiveTextEditor.document.lineAt(lineAt);
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
				//OnUserChangedSelection(null)
			}, 100)
		})
	}

	PlaceTextEditorCursorAtEndOfLine(selectedLineAt) {
		let line = this.lastActiveTextEditor.document.lineAt(selectedLineAt);
		let pos = new vscode.Position(selectedLineAt, line.range.end)
		this.lastActiveTextEditor.selections = [new vscode.Selection(pos, pos)]
	}
}

module.exports = (params) => {
	return new ClassForRequire(params)
}

//module.exports = new ClassForRequire(pandaUtils)