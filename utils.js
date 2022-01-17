class ClassForRequire {

	constructor() {}

	getFileExtension (filename) {
		return filename.substring(filename.lastIndexOf('.')+1, filename.length) || filename;
	}

	removeFileExtension (str) {
		return str.substring(0, str.length - (this.getFileExtension(str).length + 1))
	}
}

module.exports = new ClassForRequire()