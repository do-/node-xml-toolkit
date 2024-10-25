const assert = require ('assert')

const fs   = require ('fs')
const path = require ('path')

const XMLParser = require ('./XMLParser.js')
const XMLReader = require ('./XMLReader.js')
const XMLSchema = require ('./XMLSchema.js'), {adjustNode} = XMLSchema
const {XMLNamespace, XMLSchemaNamespace} = require ('./NamespacesMap.js')
const XMLMarshaller = require ('./XMLMarshaller.js')
const {
	XSSimpleType,
	XSSimpleTypeBoolean,
	XSSimpleTypeDate,
	XSSimpleTypeDateTime,
} = require ('./XSSimpleType.js')

const IDX = Symbol ('_index')

const XMLSchemata = class extends Map {

	constructor (fn) {
	
		super ()
		
		this [IDX] = new Map ()
		
		this.documents = []

		this.parser = new XMLParser ()
		this.addFileSync (path.join (__dirname, 'xsd.xsd'))
		this.get (XMLSchema.namespaceURI).getSimpleTypeClass = function (node) {
			switch (node.attributes.name) {
				case 'boolean' : return XSSimpleTypeBoolean
				case 'date'    : return XSSimpleTypeDate
				case 'dateTime': return XSSimpleTypeDateTime
				default        : return XSSimpleType
			}
		}
		
		if (fn) {
			this.addFileSync (fn)
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

		if (node.localName === 'simpleType' && !node._xsSimpleType) node._xsSimpleType = new (schema.getSimpleTypeClass (node)) ()

		return node

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

		return node._xsSimpleType = new (this.getAttributeSimpleTypeClass (node)) ()

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
			
	async addSchema (node, options = {}) {

		let {targetNamespace} = node.attributes; if (!targetNamespace) targetNamespace = options.targetNamespace

		if (!this.has (targetNamespace)) this.set (targetNamespace, new XMLSchema (this, targetNamespace))
		
		const imp = node.children.filter (e => e.localName === 'import' && e.namespaceURI === XMLSchema.namespaceURI)
		
		if (imp.length !== 0) await Promise.all (imp.map (i => {
		
			const {schemaLocation, namespace} = i.attributes
			
			return options.addLocation (schemaLocation, namespace)
		
		}))		
		
		this.get (targetNamespace).add (node)

	}
	
	async addFile (fn, options = {}) {
			
		const dirname = path.dirname (fn), that = this, addLocation = async function (schemaLocation, namespace) {
			
			await that.addFile (path.join (dirname, schemaLocation), options = {targetNamespace: namespace})
			
		}

		const {targetNamespace} = options, mapper = n => n.detach ()

		for await (const node of 

			new XMLReader ({
				filterElements: e => e.namespaceURI === XMLSchema.namespaceURI,
				map: adjustNode,
			})
			.process (fs.createReadStream (fn))

		) 

			if (node.localName === 'schema')
			
				await this.addSchema (mapper (node), {addLocation, targetNamespace})
	
	}

	addSchemaSync (node, options = {}) {
	
		if (node.localName !== 'schema' || node.namespaceURI !== XMLSchema.namespaceURI) {

			const {children} = node; if (children) for (const i of children) this.addSchemaSync (i, options)
				
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

	addFileSync (fn, options = {}) {

		const dirname = path.dirname (fn), that = this

		options.addLocation = function (schemaLocation, namespace) {

			that.addFileSync (path.join (dirname, schemaLocation), {targetNamespace: namespace})

		}

		const document = this.parser.process (fs.readFileSync (fn, 'utf-8'))

		this.documents.push (document)

		this.addSchemaSync (document, options)

	}

}

XMLSchemata.fromFile = async function (fn, options = {}) {

	let xs = new XMLSchemata ()
	
	await xs.addFile (fn, options)
	
	return xs

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