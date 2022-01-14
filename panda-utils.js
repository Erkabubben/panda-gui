class ClassForRequire {

	constructor() {
		this.message = 'HEJ HÄR HAR INGET FÖRÄNDRATS'
	}

	GetAsPandaFloat (value) {
		if (String(value).indexOf('.') == -1) {
			return value + '.0'
		}
		return value
	}

	GetImageFromCinematicImageLine (line) {
		return line.text.split(':')[1].split(';')[0]
	}
	
	GetBambooLineContent (line) {
		const lineText = line.text.trim()
		const paramsStart = lineText.indexOf(':')
		const command = lineText.slice(0, paramsStart)
		const params = lineText.slice(paramsStart + 1).split(',')
		for (let i = 0; i < params.length; i++) {
			params[i] = params[i].trim()
		}
		return {
			command: command,
			params: this.ParseParams(params)
		}
	}
	
	GetPandaLineContent (line) {
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
			params: this.ParseParams(params)
		}
	}
	
	DeterminePandaOrBambooLine (line) {
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

	ReplaceBambooParam (line, paramNumber, newParam) {
		let newLine = line.text
		const paramsStart = line.text.indexOf(':')
		// TODO: Allow line comments
		//const paramsEnd = line.text.lastIndexOf('//')
		let testEndStr = line.text
		testEndStr.trimEnd()
		const paramsEnd = testEndStr.charAt(testEndStr.length - 1)
		const command = line.text.slice(0, paramsStart)
		let params = line.text.slice(paramsStart + 1, paramsEnd).split(';')
		if (paramNumber < params.length) {
			params[paramNumber] = (paramNumber == 0 ? '' : ' ') + newParam
		} else {
			for (let i = params.length; i < paramNumber; i++) {
				params.push((paramNumber == 0 ? '' : ' ') + '0.0')
			}
			params.push((paramNumber == 0 ? '' : ' ') + newParam)
		}
		newLine = line.text.slice(0, paramsStart) + ':' + params.join(';') + line.text.slice(paramsEnd)
		return newLine
	}

	ReplacePandaParam (line, paramNumber, newParam) {
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
		return newLine
	}

	ParseParams (params) {
		for (let i = 0; i < params.length; i++) {
			if (params[i].startsWith("\"") && params[i].endsWith("\"")) {
				params[i] = params[i].slice(1, params[i].length - 1)
			}
		}
		return params
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