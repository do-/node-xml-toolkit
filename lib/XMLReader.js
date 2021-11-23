const assert      = require ('assert')
const {Transform} = require ('stream')
const SAXEvent    = require ('./SAXEvent.js')

const XMLReader = class extends Transform {

	constructor (options = {}) {

		options.decodeStrings = false
		options.objectMode = true

		super (options)

	}

	_flush (callback) {

		this.push ({type: SAXEvent.TYPES.END_DOCUMENT})

		callback ()
	
	}
	
	_transform (chunk, encoding, callback) {

		if (chunk.length !== 0) {
		
			let e = new SAXEvent (chunk), {type} = e
			
			if (type === SAXEvent.TYPES.CDATA) {
			
				e = new SAXEvent (e.text)
				
				type = SAXEvent.TYPES.CHARACTERS
				
			}

			this.push (e)

			if (type === SAXEvent.TYPES.START_ELEMENT && e.isSelfEnclosed) {

				e = new SAXEvent ('</>')

				this.push (e)

			}
		
		}

		callback ()

	}

}

module.exports = XMLReader