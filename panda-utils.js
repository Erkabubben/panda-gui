class ClassForRequire {

	constructor() {}

	GetAsPandaFloat (value) {
		if (String(value).indexOf('.') == -1) {
			return value + '.0'
		}
		return value
	}

	ParseParams (params) {
		for (let i = 0; i < params.length; i++) {
			if (params[i].startsWith("\"") && params[i].endsWith("\"")) {
				params[i] = params[i].slice(1, params[i].length - 1)
			}
		}
		return params
	}
	
	DeterminePandaOrBambooLine (line) {
		for (let i = 0; i < line.text.length; i++) {
			if (line.text[i] == '(') {
				return 'panda'
			} else if (line.text[i] == ':') {
				return 'bamboo'
			}
		}
		return 'none'
	}

	ReplaceBambooParam (line, paramNumber, newParam) {
		const parts = this.GetPartsOfLine(line, 'bamboo')
		this.ReplaceParamsArrayItem(parts, paramNumber, newParam)
		return this.AssembleLine(parts, 'bamboo')
	}

	ReplacePandaParam (line, paramNumber, newParam) {
		const parts = this.GetPartsOfLine(line, 'panda')
		this.ReplaceParamsArrayItem(parts, paramNumber, newParam)
		return this.AssembleLine(parts, 'panda')
	}

	SetLineComment (line, lineType, newLineComment) {
		const parts = this.GetPartsOfLine(line, lineType)
		parts.lineComment = '// ' + newLineComment
		return this.AssembleLine(parts, lineType)
	}

	GetPartsOfLine (line, lineType) {
		const isPanda = lineType === 'panda' ? true : false
		const paramDelimiter = isPanda ? ',' : ';'
		let paramsStartIndex, paramsEndIndex, command, params, afterParams, lineCommentStartIndex
		paramsStartIndex = isPanda ? line.text.indexOf('(') : line.text.indexOf(':')
		command = line.text.slice(0, paramsStartIndex)
		lineCommentStartIndex = line.text.indexOf('//')
		let testEndStr
		if (isPanda) {
			testEndStr = line.text.slice(0, line.text.indexOf(')'))
		} else {
			testEndStr = lineCommentStartIndex !== -1 ? line.text.slice(0, lineCommentStartIndex).trimEnd() : line.text.trimEnd()
			while (testEndStr.length > 0 && testEndStr.charAt(testEndStr.length - 1) === ';') {
				testEndStr = testEndStr.slice(0, -1)
			}
		}
		paramsEndIndex = testEndStr.length
		params = line.text.slice(paramsStartIndex + 1, paramsEndIndex).split(paramDelimiter)
		for (let i = 0; i < params.length; i++) {
			params[i] = params[i].trim()
		}
		const lineComment = lineCommentStartIndex !== -1 ? line.text.slice(lineCommentStartIndex) : ''
		return {
			command: command,
			params: params,
			lineComment: lineComment
		}
	}

	AssembleLine (partsObject, lineType) {
		const isPanda = lineType === 'panda' ? true : false
		let newline = partsObject.command
		newline += isPanda ? '(' : ':'
		for (let i = 0; i < partsObject.params.length; i++) {
			newline += partsObject.params[i]
			if (i < partsObject.params.length - 1) {
				newline += (isPanda ? ',' : ';') + (isPanda ? ' ' : '')
			}
		}
		newline += isPanda ? ')' : ''
		newline += partsObject.lineComment !== '' ? (' ' + partsObject.lineComment) : ''
		return newline
	}

	ReplaceParamsArrayItem(parts, paramNumber, newParam) {
		if (paramNumber < parts.params.length) {
			parts.params[paramNumber] = newParam.trim()
		} else {
			for (let i = parts.params.length; i < paramNumber; i++) {
				parts.params.push('0.0')
			}
			parts.params.push(newParam.trim())
		}
	}

	GetBasePath (lastActiveTextEditor, lineNumber) {
		const line = this.GetFirstLineAboveStartingWith(lastActiveTextEditor, lineNumber, '#path:')
		return line != null ? line.text.split(':')[1].trim() : ""
	}
	
	GetParticipants (lastActiveTextEditor, pandaGUIData, lineNumber) {
		const playerCharacter = pandaGUIData.playerCharacter
		const line = this.GetFirstLineAboveStartingWith(lastActiveTextEditor, lineNumber, 'SetParticipants(')
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

	GetFirstLineAboveStartingWith (lastActiveTextEditor, lineNumber, startsWith) {
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

	GetPortraitOfPrintLine (lastActiveTextEditor, lineNumber) {
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
}

module.exports = new ClassForRequire()