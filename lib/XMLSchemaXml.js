const fs = require ('fs')
const path = require ('path')

const XMLSchema = require ('./XMLSchema.js')
const NamespacesMap = require ('./NamespacesMap.js')

class XMLSchemaXml extends XMLSchema {

	constructor (parent) {

		const fn = path.join (__dirname, 'xml.xsd')

		const xml = fs.readFileSync (fn, 'utf-8')

		const doc = parent.parser.process (xml)
		
		super (parent, NamespacesMap.XMLNamespace, doc)

	}

}

module.exports = XMLSchemaXml