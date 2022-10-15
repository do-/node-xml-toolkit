const XMLNode  = require ('./XMLNode.js')

const XMLIterator = class {

	constructor (src, options = {}) {
	
		this.src     = src
		this.options = options
		this.pos     = 0

	}
	
	[Symbol.iterator] () {
	    return this;
	}

	next () {
	
		const {src, pos} = this

		if (src.length - pos < 1) return {done: true}
		
		const value = new XMLNode (src.slice (pos))

		value.trim ()
		
		const {length} = value.src; if (length === 0) return {done: true}

		this.pos += length

		return {value}

	}
	
}

module.exports = XMLIterator