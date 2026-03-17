const XMLNode  = require ('./XMLNode.js')
const SAXEvent = require ('./SAXEvent.js')
const EntityResolver = require ('./EntityResolver.js')

const CH_LF = '\n'.charCodeAt (0)

const XMLIterator = class {

	constructor (src, options = {}) {
	
		this.src          = src
		this.options      = options
		this.pos          = 0
		this.selfEnclosed = null
		this.entityResolver = options.entityResolver ?? new EntityResolver ()

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

	get linePos () {

		const {pos} = this

		let l = 1, c = -1

		for (let i = pos; i >= 0; i --) {

			if (this.src.charCodeAt (i) !== CH_LF) continue

			l ++; if (c !== -1) continue

			c = pos - i

		}

		return [l, c]

	}

	next () {
	
		if (this.selfEnclosed !== null) return this.autoClose ()
	
		const {src, pos, entityResolver} = this

		if (src.length - pos < 1) return {done: true}
		
		const value = new XMLNode (src.slice (pos), entityResolver)

		value.trim ()
		
		const {length} = value.src; if (length === 0) return {done: true}

		this.pos += length

		if (value.isStartElement && value.isSelfEnclosed) this.selfEnclosed = value

		return {value}

	}
	
}

module.exports = XMLIterator