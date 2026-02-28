const fs   = require ('fs')
const path = require ('path')

const NamespacesMap = require ('./NamespacesMap.js')
const XMLParser = require ('./XMLParser.js')
const XMLSchema = require ('./XMLSchema.js')
const XMLSchemaXml = require ('./XMLSchemaXml.js')
const XMLSchemaBuiltIn = require ('./XMLSchemaBuiltIn.js')
const XMLMarshaller = require ('./XMLMarshaller.js')

const XSAnyType = require ('./XSAnyType.js')
const {XSSimpleType} = require ('./simple/XSSimpleType.js')

const IDX = Symbol ('_index')

const XMLSchemata = class extends Map {

	constructor (fn) {
	
		super ()

		this.documents = []
		
		this [IDX] = new Map ()

		this.parser = new XMLParser ()

		new XMLSchemaXml (this)
		new XMLSchemaBuiltIn (this)

		this.loadedFiles = new Set()

		this.addFile (fn)

	}

	getDebugQName (localName, namespaceURI) {

		return namespaceURI ? `{${namespaceURI}}${localName}` : localName

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

		if (!('targetNamespace' in node)) node.targetNamespace = namespaceURI

		return node

	}

	getAnyType (node) {

		if ('_xsAnyType' in node) return node._xsAnyType

		return node._xsAnyType = new XSAnyType (this, node)

	}

	getSimpleType (node) {

		if ('_xsSimpleType' in node) return node._xsSimpleType

		return node._xsSimpleType = new (this.getSimpleTypeClass (node)) (this)

	}

	getSimpleTypeClass (node) {
		
		if (node) for (const {localName, attributes: {base}, children} of node.children) switch (localName) {

			case 'restriction': return this.getType (base)._xsSimpleType.restrict (children)

		}

		return XSSimpleType

	}

	getAttributeSimpleTypeClass ({children: [child]}) {

		return this.getSimpleTypeClass (child) // annotations are filtered out

	}

	getAttributeSimpleType (node) {

		if ('_xsSimpleType' in node) return node._xsSimpleType

		const {attributes: {type}} = node; if (type) return node._xsSimpleType = this.getType (type)._xsSimpleType

		return node._xsSimpleType = new (this.getAttributeSimpleTypeClass (node)) (this)

	}

	getByReference (ref) {

		const [localName, namespaceURI] = ref
						
		return this.getSchema (namespaceURI).get (localName)

	}

	getSchema (namespaceURI) {

		if (!this.has (namespaceURI)) throw new Error ('Unknown namespace: ' + namespaceURI)

		return this.get (namespaceURI)

	}

	getTypeDefinition (node) {

		while (node.attributes.ref) node = this.getByReference (node.attributes.ref)

		if (node.attributes.type) return this.getType (node.attributes.type)

		return node.children.find (i => i.localName.endsWith ('Type'))

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

		const entries = Object.entries (data), {length} = entries; if (length !== 1) throw Error ('The data object must have exactly 1 entry, found: ' + length)

		const [[localName, content]] = entries; return this.createMarshaller (localName).stringify (content, o)
	
	}

	addFromNode (node, options) {
	
		if (node.localName === 'schema' && node.namespaceURI === XMLSchema.namespaceURI) return this.addSchema (node, options)
			
		for (const child of node.children) this.addFromNode (child, options)

	}

	addSchema (node, options) {

		const targetNamespace = node.attributes.get ('targetNamespace')
		
		const schema = new XMLSchema (this, targetNamespace, node)
			
		for (const {localName, namespaceURI, attributes: {schemaLocation, namespace}} of schema._src.children)

			if (localName === 'import' && namespaceURI === XMLSchema.namespaceURI && namespace !== NamespacesMap.XMLNamespace)

				this.addFile (path.join (options.dirname, schemaLocation), {targetNamespace: namespace})

	}

	addFile (fn, options = {}) {

		if (this.loadedFiles.has (fn)) return

		this.loadedFiles.add (fn)

		options.dirname = path.dirname (fn)

		const document = this.parser.process (fs.readFileSync (fn, 'utf-8'))

		this.documents.push (document)

		this.addFromNode (document, options)

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