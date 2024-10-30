const fs = require ('fs')
const path = require ('path')

const XMLSchema = require ('./XMLSchema.js')
const {XSSimpleType} = require ('./XSSimpleType.js')

class XMLSchemaBuiltIn extends XMLSchema {

	constructor (parent) {

		const fn = path.join (__dirname, 'xsd.xsd')

		const xml = fs.readFileSync (fn, 'utf-8')

		const doc = parent.parser.process (xml)
		
		super (parent, XMLSchema.namespaceURI, doc) 

	}

	getSimpleTypeClass (node) {

		return XSSimpleType.forName (node.attributes.name)

	}

}

module.exports = XMLSchemaBuiltIn