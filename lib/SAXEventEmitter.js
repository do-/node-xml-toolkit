const assert     = require ('assert')
const {Writable} = require ('stream')
const SAXEvent   = require ('./SAXEvent.js')

const SAXEventEmitter = class extends Writable {

	constructor (options = {}) {

		options.decodeStrings = false

		super (options)
		
		this.on ('finish', () => this.emit (SAXEvent.TYPES.END_DOCUMENT))

	}

	_write (chunk, encoding, callback) {

		if (chunk.length !== 0) {
		
			let e = new SAXEvent (chunk), {type} = e
			
			if (type === SAXEvent.TYPES.CDATA) {
				e = new SAXEvent (e.text)
				type = SAXEvent.TYPES.CHARACTERS
			}

			this.emit (type, e)
		
			if (type === SAXEvent.TYPES.TYPE_START_ELEMENT && e.isSelfEnclosing ()) {
				this.emit (SAXEvent.TYPES.TYPE_END_ELEMENT, e)
			}
		
		}

		callback ()

	}

}

module.exports = SAXEventEmitter