const pandaUtils = require('./panda-utils.js');
const vscode = require('vscode');

class ClassForRequire {

	constructor() {

	}
}

module.exports = (params) => {
	return new ClassForRequire(params)
}
