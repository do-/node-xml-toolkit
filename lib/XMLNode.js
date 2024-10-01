const os = require ('os')
const SAXEvent      = require ('./SAXEvent.js')
const AttributesMap = require ('./AttributesMap')
const NamespacesMap = require ('./NamespacesMap')
const MoxyLikeJsonEncoder = require ('./MoxyLikeJsonEncoder')

const ENTITY_RESOLVER = Symbol ('_entityResolver')
const ATTRIBUTES = Symbol ('_attributes')
const TYPE       = Symbol ('_type')
const PARENT     = Symbol ('_parent')
const LEVEL      = Symbol ('_level')
const NS_MAP     = Symbol ('_ns_map')

const stringEscape = require ('string-escape-map')

const ESC = [
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['&', '&amp;'],  
  [String.fromCharCode (10), '&#xA;'],
  [String.fromCharCode (13), '&#xD;'],
]

const ESC_BODY = new stringEscape (ESC)
const ESC_ATTR = new stringEscape ([...ESC,	['"', '&quot;']])

const m2o = 
	Object.fromEntries ? m => Object.fromEntries (m.entries ()) :
	m => {let o = {}; for (const [k, v] of m.entries ()) o [k] = v; return o}

const XMLNode = class extends SAXEvent {

	constructor (src, entityResolver = null, _type) {

		super (src)

		this [TYPE] = _type || super.type

		this [ENTITY_RESOLVER] = entityResolver
		this [PARENT]     = null
		this [LEVEL]      = 0
		
		this.children     = null

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

		for (const name of ['space', 'attrSpace']) {

			if (options [name] == null) options [name] = 0
				
			if (typeof options [name] === 'number') options [name] = ' '.repeat (options [name])
		
		}
	
		if (options.space && options.EOL == null) options.EOL = os.EOL

		return this.toFormattedString (options, level).trimStart ()

	}

	toSourceString () {

		const {src} = this; if (this.type !== SAXEvent.TYPES.END_ELEMENT || this.isSelfEnclosed) return src

		let s = this.src
	
		for (const child of this.children) s += child.toSourceString ()
		
		return s + this.xml

	}

	toFormattedString (options, level = 0) {

		if (this.type !== SAXEvent.TYPES.END_ELEMENT) return ESC_BODY.escape (this.src)

		const space = options.space ? `${options.EOL}${options.space.repeat (level)}` : ''
		
		let s = `${space}<${this.name}`

		for (let [name, value] of this.attributes.entries ()) {

			value = ESC_ATTR.escape (value)
				
			s += ` ${name}="${value}"`

		}

		if (this.isSelfEnclosed) return s + ' />'

		s += '>'

		const {children} = this

		for (const child of children) s += child.toFormattedString (options, level + 1)

		if (children.length !== 1 || children [0].type != SAXEvent.TYPES.CHARACTERS) s += space
			
		return s + `</${this.name}>`

	}

	get text () {

		let s = super.text

		if (this [TYPE] === SAXEvent.TYPES.CHARACTERS) {
			
			const entityResolver = this [ENTITY_RESOLVER]
		
			if (entityResolver) return entityResolver.fix (s)
		
		}

		return s

	}

	detach_children (list, o = {}) {
	
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
					children      : this.detach_children (children, o),
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