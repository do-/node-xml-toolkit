const XMLLexerBodyString = class {

	constructor () {
		this.bodyString	= ''
	}

	append (chunk) {
		this.bodyString += chunk
	}

	trim (start) {
		this.bodyString = this.bodyString.slice (start)
	}
	
	charCodeAt (pos) {
		return this.bodyString.charCodeAt (pos)	
	}

	indexOfLt (pos) {
		return this.bodyString.indexOf ('<', pos)
	}

	indexOfGt (pos) {
		return this.bodyString.indexOf ('>', pos + 1)
	}
	
	slice (from, to) {
		return this.bodyString.slice (from, to)		
	}

	size () {
		return this.bodyString.length
	}

}

module.exports = XMLLexerBodyString