const assert = require ('assert')

const fs   = require ('fs')
const path = require ('path')

const XMLParser = require ('./XMLParser.js')
const XMLSchema = require ('./XMLSchema.js'), {adjustNode} = XMLSchema
const {XMLNamespace, XMLSchemaNamespace} = require ('./NamespacesMap.js')
const XMLMarshaller = require ('./XMLMarshaller.js')

const {
	XSSimpleType,
	XSSimpleTypeBoolean,
	XSSimpleTypeDate,
	XSSimpleTypeDateTime,
	XSSimpleTypeFloat,
	XSSimpleTypeDecimal,
	XSSimpleTypeQName,
} = require ('./XSSimpleType.js')

const IDX = Symbol ('_index')

const XMLSchemata = class extends Map {

	constructor (fn) {
	
		super ()
		
		this [IDX] = new Map ()
		
		this.documents = []

		this.parser = new XMLParser ()
		this.addFile (path.join (__dirname, 'xsd.xsd'))
		this.get (XMLSchema.namespaceURI).getSimpleTypeClass = function (node) {
			switch (node.attributes.name) {
				case 'QName'   : return XSSimpleTypeQName
				case 'boolean' : return XSSimpleTypeBoolean
				case 'date'    : return XSSimpleTypeDate
				case 'dateTime': return XSSimpleTypeDateTime
				case 'decimal' : return XSSimpleTypeDecimal
				case 'float'   :
				case 'double'  :
								 return XSSimpleTypeFloat
				default        : return XSSimpleType
			}
		}
		
		if (fn) {
			this.addFile (fn)
		}

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
	
		assert.strictEqual (typeof data, 'object')
		
		assert.strictEqual (Object.keys (data).length, 1)
		
		for (let [localName, content] of Object.entries (data)) 
		
			return this.createMarshaller (localName).stringify (content, o)
	
	}

	addSchema (node, options = {}) {
	
		if (node.localName !== 'schema' || node.namespaceURI !== XMLSchema.namespaceURI) {

			const {children} = node; if (children) for (const i of children) this.addSchema (i, options)
				
			return
			
		}
	
		node = adjustNode (node, true).detach ()

		let targetNamespace = node.attributes.targetNamespace || options.targetNamespace

		if (targetNamespace && !this.has (targetNamespace)) this.set (targetNamespace, new XMLSchema (this, targetNamespace))

		const {addLocation} = options; for (const {localName, namespaceURI, attributes} of node.children)

			if (localName === 'import' && namespaceURI === XMLSchema.namespaceURI)

				addLocation (attributes.schemaLocation, attributes.namespace)

		if (targetNamespace) this.get (targetNamespace).add (node)

	}

	addFile (fn, options = {}) {

		const dirname = path.dirname (fn), that = this

		options.addLocation = function (schemaLocation, namespace) {

			that.addFile (path.join (dirname, schemaLocation), {targetNamespace: namespace})

		}

		const document = this.parser.process (fs.readFileSync (fn, 'utf-8'))

		this.documents.push (document)

		this.addSchema (document, options)

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