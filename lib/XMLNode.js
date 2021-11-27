const SAXEvent      = require ('./SAXEvent.js')
const AttributesMap = require ('./AttributesMap')

const XML_READER = Symbol ('_xmlReader')
const ATTRIBUTES = Symbol ('_attributes')
const TYPE       = Symbol ('_type')

const XMLNode = class extends SAXEvent {

	constructor (src, xmlReader, _type) {

		super (src)
		
		this [TYPE] = _type || super.type
		
		this [XML_READER] = xmlReader
		
	}
	
	get type () {
	
		return this [TYPE]
	
	}
	
	readAttributes () {

		const m = new AttributesMap (this [XML_READER])
		
		this.writeAttributesToMap (m)
		
		this [ATTRIBUTES] = m

	}

	get attributes () {
	
		if (!(ATTRIBUTES in this)) this.readAttributes ()

		return this [ATTRIBUTES]
	
	}
	
	get text () {

		let s = super.text
		
		if (this [TYPE] === SAXEvent.TYPES.CHARACTERS) s = this [XML_READER].fixText (s)

		return s

	}

}

module.exports = XMLNode