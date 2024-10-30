const fs   = require ('fs')
const path = require ('path')

const XMLParser = require ('./XMLParser.js')
const XMLSchema = require ('./XMLSchema.js')
const XMLSchemaBuiltIn = require ('./XMLSchemaBuiltIn.js')

const {XMLNamespace, XMLSchemaNamespace} = require ('./NamespacesMap.js')
const XMLMarshaller = require ('./XMLMarshaller.js')

const {XSSimpleType} = require ('./XSSimpleType.js')

const IDX = Symbol ('_index')

const XMLSchemata = class extends Map {

	constructor (fn) {
	
		super ()
		
		this [IDX] = new Map ()

		this.parser = new XMLParser ()

		new XMLSchemaBuiltIn (this)

		if (fn) this.addFile (fn)

	}
	
	register (name, targetNamespace) {
	
		const idx = this [IDX]
		
		if (!idx.has (name)) idx.set (name, new Set ())
		
		idx.get (name).add (targetNamespace)
	
	}

	getType ([localName, namespaceURI]) {
	
		const schema = this.get (namespaceURI); if (schema == null) throw new Error ('Unknown namespace: ' + namespaceURI)

		const node = schema.getType (localName)

		if (node.localName === 'simpleType' && !node._xsSimpleType) node._xsSimpleType = new (schema.getSimpleTypeClass (node)) (this)

		return node

	}

	getSimpleType (node) {

		if ('_xsSimpleType' in node) return node._xsSimpleType

		return node._xsSimpleType = new (this.getSimpleTypeClass (node)) (this)

	}

	getSimpleTypeClass (node) {
		
		for (const {localName, namespaceURI, attributes: {base}, children} of node.children)
				
			if (localName === 'restriction' && namespaceURI === XMLSchema.namespaceURI)

				return this.getType (base)._xsSimpleType.restrict (children.map (

					({localName, attributes: {value}}) => ({name: localName, value})

				))

		return XSSimpleType

	}

	getAttributeSimpleTypeClass ({children}) {

		for (const child of children)

			if (child.localName === 'simpleType' && child.namespaceURI === XMLSchema.namespaceURI)

				return this.getSimpleTypeClass (child)

		return XSSimpleType

	}

	getAttributeSimpleType (node) {

		if ('_xsSimpleType' in node) return node._xsSimpleType

		const {attributes: {type}} = node; if (type) return node._xsSimpleType = this.getType (type)._xsSimpleType

		return node._xsSimpleType = new (this.getAttributeSimpleTypeClass (node)) (this)

	}

	getByReference (ref) {

		const [localName, namespaceURI] = ref
		
		if (namespaceURI === XMLNamespace) return {
			localName: 'attribute',
			namespaceURI,
			attributes: {name: localName, type: ['string', XMLSchemaNamespace]},
			children: [],
			namespacesMap: {},
			targetNamespace: namespaceURI
		}

		const s = this.get (namespaceURI); if (s == null) throw new Error ('Unknown namespace: ' + namespaceURI)
				
		return s.get (localName)

	}

	getSchemaByLocalName (localName) {
	
		const ns = this [IDX].get (localName)
		
		if (!ns) throw new Error ('Unknown name: ' + localName)

		if (ns.size !== 1) throw new Error ('Ambiguous name ' + localName + ' belongs to: ' + Array.from (ns.values ()).map (s => `"${s}"`).join (', '))

		for (const uri of ns) return this.get (uri)
	
	}
	
	createMarshaller (localName, namespaceURI, printerOptions) {
	
		if (arguments.length === 1) namespaceURI = this.getSchemaByLocalName (localName).targetNamespace
		
		return new XMLMarshaller (this, localName, namespaceURI, printerOptions)
	
	}
	
	stringify (data, o) {

		if (data == null) throw Error ('Cannot stringify ' + data)

		if (typeof data !== 'object') throw Error ('Not an Object instance: ' + data)

		const entries = Object.entries (data), {length} = entries; if (length !== 1) throw Error ('The data object must have exaclly 1 entry, found: ' + length)

		const [[localName, content]] = entries; return this.createMarshaller (localName).stringify (content, o)
	
	}

	addFromNode (node, options = {}) {
	
		if (node.localName === 'schema' && node.namespaceURI === XMLSchema.namespaceURI) return this.addSchema (node, options)
			
		for (const child of node.children) this.addFromNode (child, options)

	}

	addSchema (node, options) {

		const targetNamespace = node.attributes.get ('targetNamespace') || options.targetNamespace; if (this.has (targetNamespace)) return

		const schema = new XMLSchema (this, targetNamespace, node)
			
		for (const {localName, namespaceURI, attributes: {schemaLocation, namespace}} of schema._src.children)

			if (localName === 'import' && namespaceURI === XMLSchema.namespaceURI)

				this.addFile (path.join (options.dirname, schemaLocation), {targetNamespace: namespace})

	}

	addFile (fn, options = {}) {

		options.dirname = path.dirname (fn)

		this.addFromNode (this.parser.process (fs.readFileSync (fn, 'utf-8')), options)

	}

	static async fromFile (fn) {

		return new XMLSchemata (fn)

	}

}

XMLSchemata.any = (xml, attributes) => {

	if (attributes == null && Array.isArray (xml) && xml.length === 2) {

		attributes = xml [1]

		xml = xml [0]

	}
	
	if (attributes == null) attributes = {}

	return {null: {[xml]: attributes}}

}

module.exports = XMLSchemata