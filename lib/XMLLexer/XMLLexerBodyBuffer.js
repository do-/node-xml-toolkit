const assert = require ('assert')

const CH_LT = '<'.charCodeAt (0)
const CH_GT = '>'.charCodeAt (0)

const XMLLexerBodyBuffer = class {

	constructor (options = {}) {

		this.encoding = options.encoding
		
		assert (this.encoding != null, 'Encoding not set')

		this.body = Buffer.alloc (0)

	}

	append (chunk) {
		this.body = Buffer.concat ([this.body, chunk], this.body.length + chunk.length)
	}

	trim (start) {
		this.body = this.body.slice (start)
	}
	
	charCodeAt (pos) {
		return this.body [pos]
	}

	indexOfLt (pos) {
		return this.body.indexOf (CH_LT, pos)
	}

	indexOfGt (pos) {
		return this.body.indexOf (CH_GT, pos + 1)
	}
	
	slice (from, to) {
		return this.body.toString (this.encoding, from, to)		
	}

	size () {
		return this.body.length
	}

}

module.exports = XMLLexerBodyBuffer