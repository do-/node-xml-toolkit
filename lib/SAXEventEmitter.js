const assert     = require ('assert')
const {Writable} = require ('stream')

const CH_LT          = '<'.charCodeAt (0)
const CH_EXCLAMATION = '!'.charCodeAt (0)
const CH_QUESTION    = '?'.charCodeAt (0)
const CH_SLASH       = '/'.charCodeAt (0)
const CH_MINUS       = '-'.charCodeAt (0)

const STR_XML        = 'XML'
const STR_CDATA      = '[CDATA['
const STR_DOCTYPE    = 'DOCTYPE'

const TYPE_START_DOCUMENT         = 'StartDocument'
const TYPE_PROCESSING_INSTRUCTION = 'ProcessingInstruction'
const TYPE_COMMENT                = 'Comment'
const TYPE_DTD                    = 'DTD'
const TYPE_START_ELEMENT          = 'StartElement'
const TYPE_CHARACTERS             = 'Characters'
const TYPE_END_ELEMENT            = 'EndElement'
const TYPE_END_DOCUMENT           = 'EndDocument'
const TYPE_CDATA                  = 'CDATA'

const SAXEventEmitter = class extends Writable {

	constructor (options = {}) {

		options.decodeStrings = false

		super (options)
		
		this.level = 0

		this.on ('finish', () => this.emit (TYPE_END_DOCUMENT))

	}

	publish (chunk) {
		
		let type = SAXEventEmitter.getType (chunk); if (type == null) return
		
		if (type === TYPE_CDATA) {
			type = TYPE_CHARACTERS
			chunk = chunk.slice (9, -3)
		}

		this.emit (type, chunk, this.level)

		switch (type) {

			case TYPE_END_ELEMENT:

				this.level --
				break

			case TYPE_START_ELEMENT:

				switch (chunk.charCodeAt (chunk.length - 2)) {

					case CH_SLASH:
						this.emit (TYPE_END_ELEMENT, chunk)
						break

					default:
						this.level ++
						break

				}

		}

	}
		
	_write (chunk, encoding, callback) {

		if (chunk.length !== 0) this.publish (chunk)

		callback ()

	}

}

SAXEventEmitter.TYPE_START_DOCUMENT         = TYPE_START_DOCUMENT
SAXEventEmitter.TYPE_PROCESSING_INSTRUCTION = TYPE_PROCESSING_INSTRUCTION
SAXEventEmitter.TYPE_COMMENT                = TYPE_COMMENT
SAXEventEmitter.TYPE_DTD                    = TYPE_DTD
SAXEventEmitter.TYPE_START_ELEMENT          = TYPE_START_ELEMENT
SAXEventEmitter.TYPE_CHARACTERS             = TYPE_CHARACTERS
SAXEventEmitter.TYPE_END_ELEMENT            = TYPE_END_ELEMENT
SAXEventEmitter.TYPE_END_DOCUMENT           = TYPE_END_DOCUMENT

SAXEventEmitter.getType = s => {

	switch (s.charCodeAt (0)) {

		case CH_LT:

			switch (s.charCodeAt (1)) {

				case CH_SLASH: 

					return TYPE_END_ELEMENT

				case CH_QUESTION: 

					switch (s.slice (2, 5).toLowerCase ()) {

						case STR_XML: return TYPE_START_DOCUMENT

						default: return TYPE_PROCESSING_INSTRUCTION

					}

				case CH_EXCLAMATION:

					if (s.charCodeAt (2) === CH_MINUS) return TYPE_COMMENT

					switch (s.slice (2, 9)) {					

						case STR_CDATA: return TYPE_CDATA

						case STR_DOCTYPE: return TYPE_DTD
						
						default: return null

					}

				default: return TYPE_START_ELEMENT

			}

			break

		default:
		
			return TYPE_CHARACTERS
			
	}
	
}

module.exports = SAXEventEmitter