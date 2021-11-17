const assert     = require ('assert')
const {Writable} = require ('stream')

const CH_LT          = '<'.charCodeAt (0)
const CH_EXCLAMATION = '!'.charCodeAt (0)
const CH_QUESTION    = '?'.charCodeAt (0)
const CH_SLASH       = '/'.charCodeAt (0)
const CH_MINUS       = '-'.charCodeAt (0)

const XMLEventEmitter = class extends Writable {

	constructor (options = {}) {

		options.decodeStrings = false
		
		super (options)
		
		this.on ('finish', () => this.emit ('EndDocument'))
		
	}
	
	publishMarkupQ (chunk) {

		this.emit (
		
			/^<\?xml/i.test (chunk) ? 'StartDocument' 
				
				: 'ProcessingInstruction', 
			
			chunk
			
		)

	}

	publishMarkupX (chunk) {
	
		if (chunk.charCodeAt (2) === CH_MINUS) return this.emit ('Comment', chunk)

		const cd = /^<!\[CDATA\[(.*)\]\]>$/.exec (chunk); if (cd) return this.emit ('Characters', cd [1])

		if (/^<!DOCTYPE/.test (chunk)) return this.emit ('DTD', chunk)
	
	}
	
	publishMarkup (chunk) {
	
		switch (chunk.charCodeAt (1)) {
		
			case CH_QUESTION:    return this.publishMarkupQ (chunk)
			
			case CH_EXCLAMATION: return this.publishMarkupX (chunk)
			
			case CH_SLASH:       return this.emit ('EndElement', chunk)
			
			default:

				this.emit ('StartElement', chunk)

				if (chunk.charCodeAt (chunk.length - 2) === CH_SLASH) this.emit ('EndElement', chunk)

		}
	
	}
	
	publish (chunk) {

		if (chunk.charCodeAt (0) === CH_LT) return this.publishMarkup (chunk)
		
		this.emit ('Characters', chunk)

	}
		
	_write (chunk, encoding, callback) {

		if (chunk.length !== 0) this.publish (chunk)

		callback ()

	}

}

module.exports = XMLEventEmitter