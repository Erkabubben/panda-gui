export function GetFirstLineAboveStartingWith (lineNumber, startsWith) {
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

export function GetPortraitOfPrintLine (lineNumber) {
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