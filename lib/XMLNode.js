const SAXEvent      = require ('./SAXEvent.js')
const XMLPrinter    = require ('./XMLPrinter.js')
const NamespacesMap = require ('./NamespacesMap')
const MoxyLikeJsonEncoder = require ('./MoxyLikeJsonEncoder')

const ENTITY_RESOLVER = '_entityResolver'
const ATTRIBUTES = '_attributes'
const TYPE       = Symbol ('_type')
const PARENT     = Symbol ('_parent')
const LEVEL      = Symbol ('_level')
const NS_MAP     = '_ns_map'

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

	get xml () {
	
		switch (this.type) {
		
			case SAXEvent.TYPES.END_DOCUMENT: return ''
		
			case SAXEvent.TYPES.END_ELEMENT: return this.isSelfEnclosed ? '' : `</${this.name}>`
			
			default: return this.src
		
		}
	
	}

	readNamespaces () {

		this [NS_MAP] = new NamespacesMap (this) 

		this.readAttributes ()

	}

	set parent (_parent) {

		if (_parent == null) return

		this [PARENT] = _parent

		this [LEVEL] = 1 + _parent.level

		const {children} = _parent; children.push (this)

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

		const s = super.text; if (this [TYPE] !== SAXEvent.TYPES.CHARACTERS) return s
			
		const entityResolver = this [ENTITY_RESOLVER]; return entityResolver ? entityResolver.fix (s) : s

	}

	detachChildren (list) {

		if (!Array.isArray (list) || list.length === 0) return []

		const a = []; for (const i of list) {

			const d = i.detach (); if (d === null) continue

			if (typeof d === 'string') {

				let {length} = a; if (length !== 0) {

					length --; if (typeof a [length] === 'string') {

						a [length] += d

						continue

					}

				}

			}

			a.push (d)

		}

		return a

	}
	
	detach () {
	
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
					children      : this.detachChildren (children),
				}

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