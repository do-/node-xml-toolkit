const XMLLexerBodyString = class {

	constructor () {
		this.body	= ''
	}

	append (chunk) {
		this.body += chunk
	}

	trim (start) {
		this.body = this.body.slice (start)
	}
	
	charCodeAt (pos) {
		return this.body.charCodeAt (pos)	
	}

	indexOfLt (pos) {
		return this.body.indexOf ('<', pos)
	}

	indexOfGt (pos) {
		return this.body.indexOf ('>', pos + 1)
	}
	
	slice (from, to) {
		return this.body.slice (from, to)		
	}

	size () {
		return this.body.length
	}

}

module.exports = XMLLexerBodyString