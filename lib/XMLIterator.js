const XMLNode  = require ('./XMLNode.js')
const SAXEvent = require ('./SAXEvent.js')

const XMLIterator = class {

	constructor (src, options = {}) {
	
		this.src          = src
		this.options      = options
		this.pos          = 0
		this.selfEnclosed = null

	}
	
	[Symbol.iterator] () {
	    return this;
	}
	
	autoClose () {
	
		let value = this.selfEnclosed

		value.type = SAXEvent.TYPES.END_ELEMENT
		
		this.selfEnclosed = null
	
		return {value}

	}

	next () {
	
		if (this.selfEnclosed !== null) return this.autoClose ()
	
		const {src, pos} = this

		if (src.length - pos < 1) return {done: true}
		
		const value = new XMLNode (src.slice (pos))

		value.trim ()
		
		const {length} = value.src; if (length === 0) return {done: true}

		this.pos += length

		if (value.isStartElement && value.isSelfEnclosed) this.selfEnclosed = value

		return {value}

	}
	
}

module.exports = XMLIterator