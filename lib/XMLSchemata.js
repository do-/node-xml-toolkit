const fs   = require ('fs')
const path = require ('path')

const XMLReader = require ('./XMLReader.js')
const XMLNode   = require ('./XMLNode.js')
const XMLSchema = require ('./XMLSchema.js'), {adjustNode} = XMLSchema

const XMLSchemata = class extends Map {

	async addSchema (node, options = {}) {
	
		let {targetNamespace} = node; if (!targetNamespace) targetNamespace = options.targetNamespace

		if (!this.has (targetNamespace)) this.set (targetNamespace, new XMLSchema (this))
		
		let imp = node.import; 

		if (imp) {
		
			const {addLocation} = options
		
			if (!Array.isArray (imp)) imp = [imp]
			
			for (const {schemaLocation, namespace} of imp) await addLocation (schemaLocation, namespace)
		
		}

		this.get (targetNamespace).add (node)

	}
	
	async addFile (fn, options = {}) {
			
		const dirname = path.dirname (fn), that = this, addLocation = async function (schemaLocation, namespace) {
			
			await that.addFile (path.join (dirname, schemaLocation), options = {targetNamespace: namespace})
			
		}

		const {targetNamespace} = options, mapper = XMLNode.toObject ({})

		for await (const node of 

			new XMLReader ({
				filterElements: e => e.namespaceURI === 'http://www.w3.org/2001/XMLSchema',
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