const assert      = require ('assert')
const {Transform} = require ('stream')
const SAXEvent    = require ('./SAXEvent.js')
const XMLNode     = require ('./XMLNode.js')

const XMLReader = class extends Transform {

	constructor (options = {}) {

		options.decodeStrings = false
		options.objectMode = true
		
		if (!('stripSpace' in options)) options.stripSpace = false
		assert (options.stripSpace === true || options.stripSpace === false, 'options.stripSpace must be boolean, not ' + typeof options.stripSpace)

		if (!('useEntities' in options)) options.useEntities = true
		assert (options.useEntities === true || options.useEntities === false, 'options.useEntities must be boolean, not ' + typeof options.useEntities)

		super (options)

		this.stripSpace  = options.stripSpace
		this.useEntities = options.useEntities
		
		if (this.useEntities) this.entityResolver = new (require ('./EntityResolver.js')) ()
		
		this.text = ''

	}

	_flush (callback) {
	
		this.flush_text ()

		this.push ({type: SAXEvent.TYPES.END_DOCUMENT})

		callback ()

	}
	
	flush_text () {
		
		let {text} = this; if (text.length === 0) return
		
		if (this.stripSpace) text = text.trim ()
		
		if (text.length !== 0) this.push (new XMLNode (text, this, SAXEvent.TYPES.CHARACTERS))
		
		this.text = ''

	}
	
	get fixText () {
	
		if (!this.useEntities) return s => s
		
		const {entityResolver} = this

		return s => entityResolver.fix (s)

	}

	_transform (chunk, encoding, callback) {

		if (chunk.length !== 0) {

			let e = new XMLNode (chunk, this), {type} = e

			switch (type) {

				case SAXEvent.TYPES.CHARACTERS:
				case SAXEvent.TYPES.CDATA:

					this.text += e.text
					break

				default:

					this.flush_text ()
					this.push (e)
					break

			}

			if (type === SAXEvent.TYPES.START_ELEMENT && e.isSelfEnclosed) this.push (new XMLNode (e.src, this, SAXEvent.TYPES.END_ELEMENT))

		}

		callback ()

	}

}

module.exports = XMLReader