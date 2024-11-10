const AttributesMap = require ('./AttributesMap')

const CH_LT          = '<'.charCodeAt (0)
const CH_GT          = '>'.charCodeAt (0)
const CH_EXCLAMATION = '!'.charCodeAt (0)
const CH_QUESTION    = '?'.charCodeAt (0)
const CH_SLASH       = '/'.charCodeAt (0)
const CH_MINUS       = '-'.charCodeAt (0)

const STR_XML        = 'xml'
const STR_CDATA      = '[CDATA['
const STR_DOCTYPE    = 'DOCTYPE'

const START_DOCUMENT         = 'StartDocument'
const PROCESSING_INSTRUCTION = 'ProcessingInstruction'
const COMMENT                = 'Comment'
const DTD                    = 'DTD'
const START_ELEMENT          = 'StartElement'
const CHARACTERS             = 'Characters'
const END_ELEMENT            = 'EndElement'
const END_DOCUMENT           = 'EndDocument'
const CDATA                  = 'CDATA'

const SAXEvent = class {

	constructor (src) {

		this.src        = src
		
		this._afterName = 0

	}

	get type () {
	
		const {src} = this

		switch (src.charCodeAt (0)) {

			case CH_LT:

				switch (src.charCodeAt (1)) {

					case CH_SLASH: 

						return END_ELEMENT

					case CH_QUESTION: 
					
						return src.slice (2, 5) === STR_XML ? START_DOCUMENT : PROCESSING_INSTRUCTION

					case CH_EXCLAMATION:

						if (src.charCodeAt (2) === CH_MINUS) return COMMENT

						switch (src.slice (2, 9)) {

							case STR_CDATA: return CDATA

							case STR_DOCTYPE: return DTD

							default: return null

						}

					default: return START_ELEMENT

				}

			default:

				return CHARACTERS

		}

	}
	
	get text () {

		const {src} = this

		switch (src.charCodeAt (0)) {

			case CH_LT: return src.slice (9, -3)
			
			default: return src
			
		}

	}
	
	readAttributes () {
		
		if (this._afterName === 0) this.findAfterName (1)

		const m = new AttributesMap (this.src.substring (this._afterName).trimStart (), this._entityResolver, this._ns_map)
				
		this._attributes = m

	}

	get attributes () {
	
		if (!this._attributes) this.readAttributes ()

		return this._attributes
	
	}
	
	get name () {
	
		const {src} = this, start = src.charCodeAt (1) === CH_SLASH ? 2 : 1

		if (this._afterName === 0) this.findAfterName (start)

		return this.src.slice (start, this._afterName).trim ()

	}
	
	findAfterName (start) {
	
		const {src} = this, {length} = src; 

		for (let i = start; i < length; i ++) {
		
			const c = src.charCodeAt (i)
			
			switch (c) {
				case CH_SLASH:
				case CH_GT:
					return this._afterName = i	
			}
		
			if (c <= 32) return this._afterName = i
				
		}
		
		this._afterName = length - 1
	
	}
	
	get isSelfEnclosed () {

		const {src} = this

		return src.charCodeAt (src.length - 2) === CH_SLASH
	
	}

	get isStartElement () {
		
		return this.type === START_ELEMENT
		
	}

	get isEndElement () {
		
		return this.type === END_ELEMENT
		
	}

	get isCharacters () {
		
		return this.type === CHARACTERS
		
	}

}

SAXEvent.TYPES = {
	START_DOCUMENT,
	PROCESSING_INSTRUCTION,
	COMMENT,
	DTD,
	START_ELEMENT,
	CHARACTERS,         
	END_ELEMENT,
	END_DOCUMENT,
	CDATA,
}

SAXEvent.KET = new Map ([

	[START_DOCUMENT,         '?>'],
	[PROCESSING_INSTRUCTION, '?>'],

	[START_ELEMENT,           '>'],
	[END_ELEMENT,             '>'],
	[DTD,                     '>'],

	[CDATA,                 ']]>'],
	[COMMENT,               '-->'],

	[CHARACTERS,              '<'],

])

module.exports = SAXEvent