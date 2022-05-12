const assert = require ('assert')

const fs   = require ('fs')
const path = require ('path')

const XMLReader = require ('./XMLReader.js')
const XMLNode   = require ('./XMLNode.js')
const XMLSchema = require ('./XMLSchema.js'), {adjustNode} = XMLSchema
const NamespacePrefixesMap = require ('./NamespacePrefixesMap.js')
const XMLMarshaller = require ('./XMLMarshaller.js')

const IDX = Symbol ('_index')

const XMLSchemata = class extends Map {

	constructor () {
	
		super ()
		
		this [IDX] = new Map ()
	
	}
	
	register (name, targetNamespace) {
	
		const idx = this [IDX]
		
		if (!idx.has (name)) idx.set (name, new Set ())
		
		idx.get (name).add (targetNamespace)
	
	}
	
	getByReference (ref) {

		const [localName, namespaceURI] = ref
		
		if (namespaceURI === XMLSchema.namespaceURI) return {
			_type: 'simpleType',
			name: localName
		}
		
		return this.get (namespaceURI).get (localName)

	}
	
	getSchemaByLocalName (localName) {
	
		const ns = this [IDX].get (localName)
		
		if (!ns) throw new Error ('Unknown name: ' + localName)

		if (ns.size !== 1) throw new Error ('Ambiguous name ' + localName + ' belongs to: ' + Array.from (ns.values ()).map (s => `"${s}"`).join (', '))

		for (const uri of ns) return this.get (uri)
	
	}

	getNamespacePrefixesMap (o) {
	
		return new NamespacePrefixesMap (this, o)
	
	}
	
	createMarshaller (localName, namespaceURI) {
	
		if (arguments.length === 1) namespaceURI = this.getSchemaByLocalName (localName).targetNamespace
		
		return new XMLMarshaller (this, localName, namespaceURI)
	
	}
	
	stringify (o) {
	
		assert.strictEqual (typeof o, 'object')
		
		assert.strictEqual (Object.keys (o).length, 1)
		
		for (let [localName, content] of Object.entries (o)) 
		
			return this.createMarshaller (localName).stringify (content)
	
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

		const {targetNamespace} = options, mapper = n => n.detach ({nsMap: true})

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

}

XMLSchemata.fromFile = async function (fn, options = {}) {

	let xs = new XMLSchemata ()
	
	await xs.addFile (fn, options)
	
	return xs

}

module.exports = XMLSchemata