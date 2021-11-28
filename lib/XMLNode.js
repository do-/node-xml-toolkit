const SAXEvent      = require ('./SAXEvent.js')
const AttributesMap = require ('./AttributesMap')
const NamespacesMap = require ('./NamespacesMap')

const XML_READER = Symbol ('_xmlReader')
const ATTRIBUTES = Symbol ('_attributes')
const TYPE       = Symbol ('_type')
const PARENT     = Symbol ('_parent')
const LEVEL      = Symbol ('_level')
const NS_MAP     = Symbol ('_ns_map')

const XMLNode = class extends SAXEvent {

	constructor (src, xmlReader, _type) {

		super (src)

		this [TYPE] = _type || super.type

		this [XML_READER] = xmlReader
		this [PARENT]     = null
		this [LEVEL]      = 0

	}

	get level () {

		return this [LEVEL]

	}

	get parent () {

		return this [PARENT]

	}
	
	get namespacesMap () {
	
		return this [NS_MAP]
	
	}

	readNamespaces () {

		this [NS_MAP] = new NamespacesMap (this) 

		this.readAttributes ()

	}

	set parent (_parent) {
	
		if (_parent == null) return
	
		this [PARENT] = _parent

		this [LEVEL] = 1 + _parent.level
		
	}
	
	get type () {
	
		return this [TYPE]
	
	}

	set type (_type) {
	
		this [TYPE] = _type
	
	}
	
	get localName () {

		return XMLNode.getLocalName (this.name)

	}

	get namespaceURI () {
	
		return this.namespacesMap.getNamespaceURI (this.name, true)

	}
	
	readAttributes () {

		const m = new AttributesMap (this [XML_READER], this [NS_MAP])
		
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

XMLNode.getLocalName = name => {

	const pos = name.indexOf (':'); if (pos === -1) return name
		
	return name.slice (pos + 1)

}

module.exports = XMLNode