const SAXEvent      = require ('./SAXEvent.js')
const AttributesMap = require ('./AttributesMap')
const NamespacesMap = require ('./NamespacesMap')
const MoxyLikeJsonEncoder = require ('./MoxyLikeJsonEncoder')

const XML_READER = Symbol ('_xmlReader')
const ATTRIBUTES = Symbol ('_attributes')
const TYPE       = Symbol ('_type')
const PARENT     = Symbol ('_parent')
const LEVEL      = Symbol ('_level')
const NS_MAP     = Symbol ('_ns_map')

const m2o = 
	Object.fromEntries ? m => Object.fromEntries (m.entries ()) :
	m => {let o = {}; for (const [k, v] of m.entries ()) o [k] = v; return o}

const XMLNode = class extends SAXEvent {

	constructor (src, xmlReader, _type) {

		super (src)

		this [TYPE] = _type || super.type

		this [XML_READER] = xmlReader
		this [PARENT]     = null
		this [LEVEL]      = 0
		
		this.children     = null

	}

	cloneStart () {

		let e = new XMLNode (this.src, this [XML_READER], SAXEvent.TYPES.START_ELEMENT)

		e [PARENT]     = this [PARENT]
		e [LEVEL]      = this [LEVEL]

		if (ATTRIBUTES in this) e [ATTRIBUTES] = this [ATTRIBUTES]
		if (NS_MAP     in this) e [NS_MAP]     = this [NS_MAP]

		return e

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

		const {children} = _parent; if (children !== null) children.push (this)

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
	
		const {namespacesMap} = this; if (namespacesMap == null) return null
	
		return namespacesMap.getNamespaceURI (this.name, true)

	}
	
	readAttributes () {

		const m = new AttributesMap (this [XML_READER].entityResolver, this [NS_MAP])
		
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

	detach (o = {}) {
	
		switch (this.type) {

			case SAXEvent.TYPES.CHARACTERS:
			case SAXEvent.TYPES.CDATA:
				return this.text
				
			default:

				const {localName, namespaceURI, attributes, children, namespacesMap} = this
				
				let r = {
					localName,
					namespaceURI,
					attributes    : m2o (attributes),
					children      : (children || []).map (n => n.detach (o)),
				}

				if (o.nsMap) r.namespacesMap = m2o (namespacesMap || [])

				return r

		}

	}

}

XMLNode.getLocalName = name => {

	const pos = name.indexOf (':'); if (pos === -1) return name
		
	return name.slice (pos + 1)

}

XMLNode.toObject = MoxyLikeJsonEncoder

module.exports = XMLNode