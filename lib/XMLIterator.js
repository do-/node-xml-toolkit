const XMLNode  = require ('./XMLNode.js')
const SAXEvent = require ('./SAXEvent.js')
const EntityResolver = require ('./EntityResolver.js')
const XMLPosition = require ('./XMLPosition.js')

const XMLIterator = class {

	#position = new XMLPosition ()

	constructor (src, options = {}) {
	
		this.src              = src
		this.options          = options
		this.absolutePosition = 0
		this.selfEnclosed     = null
		this.entityResolver   = options.entityResolver ?? new EntityResolver ()

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

	get position () {

		return this.#position

	}

	next () {
	
		if (this.selfEnclosed !== null) return this.autoClose ()
	
		const {src, absolutePosition, entityResolver} = this

		if (src.length - absolutePosition < 1) return {done: true}
		
		const value = new XMLNode (src.slice (absolutePosition), entityResolver)

		value.trim ()

		{

			const {src} = value, {length} = src; if (length === 0) return {done: true}

			this.absolutePosition += length

			this.#position.scan (src)

		}
		
		if (value.isStartElement && value.isSelfEnclosed) this.selfEnclosed = value

		return {value}

	}
	
}

module.exports = XMLIterator