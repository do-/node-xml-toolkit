const SAXEvent      = require ('./SAXEvent.js')
const XMLPrinter    = require ('./XMLPrinter.js')
const AttributesMap = require ('./AttributesMap')
const NamespacesMap = require ('./NamespacesMap')
const MoxyLikeJsonEncoder = require ('./MoxyLikeJsonEncoder')

const ENTITY_RESOLVER = Symbol ('_entityResolver')
const ATTRIBUTES = Symbol ('_attributes')
const TYPE       = Symbol ('_type')
const PARENT     = Symbol ('_parent')
const LEVEL      = Symbol ('_level')
const NS_MAP     = Symbol ('_ns_map')

const m2o = m => Object.fromEntries (m.entries ())

const XMLNode = class extends SAXEvent {

	constructor (src, entityResolver = null, _type) {

		super (src)

		this [TYPE] = _type || super.type

		this [ENTITY_RESOLVER] = entityResolver
		this [PARENT]     = null
		this [LEVEL]      = 0
		
		this.children     = []

	}

	cloneStart () {

		let e = new XMLNode (this.src, this [ENTITY_RESOLVER], SAXEvent.TYPES.START_ELEMENT)

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

		const m = new AttributesMap (this [ENTITY_RESOLVER], this [NS_MAP])
		
		this.writeAttributesToMap (m)
		
		this [ATTRIBUTES] = m

	}

	get attributes () {
	
		if (!(ATTRIBUTES in this)) this.readAttributes ()

		return this [ATTRIBUTES]
	
	}
	
	toString (options, level = 0) {

		if (arguments.length === 0) return this.toSourceString ()

		const xp = new XMLPrinter ({level, ...options})

		xp.writeNode (this)

		return xp.text

	}

	toSourceString () {

		const {src} = this; if (this.type !== SAXEvent.TYPES.END_ELEMENT || this.isSelfEnclosed) return src

		let s = this.src
	
		for (const child of this.children) s += child.toSourceString ()
		
		return s + this.xml

	}

	get text () {

		let s = super.text

		if (this [TYPE] === SAXEvent.TYPES.CHARACTERS) {
			
			const entityResolver = this [ENTITY_RESOLVER]
		
			if (entityResolver) return entityResolver.fix (s)
		
		}

		return s

	}

	detachChildren (list, o = {}) {
	
		if (!Array.isArray (list) || list.length === 0) return []

		let last = null, a = []; for (const i of list) {
		
			const d = i.detach (); if (d === null) continue
			
			if (d instanceof String && last instanceof String) {

				last += d

			}
			else {

				a.push (last = d)

			}					
		
		}
		
		return a

	}
	
	detach (o = {}) {
	
		switch (this.type) {
		
			case SAXEvent.TYPES.CHARACTERS:
			case SAXEvent.TYPES.CDATA:
				return this.text
				
			case SAXEvent.TYPES.END_ELEMENT:

				const {localName, namespaceURI, attributes, children, namespacesMap} = this
				
				let r = {
					localName,
					namespaceURI,
					attributes    : m2o (attributes),
					children      : this.detachChildren (children, o),
				}

				if (o.nsMap) r.namespacesMap = m2o (namespacesMap || [])

				return r
				
			default:

				return null
				
		}

	}
	
	trim () {
	
		const {src, type} = this, ket = SAXEvent.KET.get (type)
		
		let pos = src.indexOf (ket)
		
		if (ket !== '<') {

			if (pos === -1) {

				const max = 20

				let txt = src; if (txt.length > max) txt = txt.slice (0, max) + '...'

				throw new Error (`Unfinished ${type}: ${txt}`)

			}

			pos += ket.length
		
		}
		
		this.src = src.slice (0, pos)
	
	}

}

XMLNode.getLocalName = name => {

	const pos = name.indexOf (':'); if (pos === -1) return name
		
	return name.slice (pos + 1)

}

XMLNode.toObject = MoxyLikeJsonEncoder

module.exports = XMLNode