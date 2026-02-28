const fs = require ('fs')
const path = require ('path')

const XMLSchema = require ('./XMLSchema.js')
const {XSSimpleType, XSSimpleTypeQName, XSSimpleTypeBoolean, XSSimpleTypeDate, XSSimpleTypeDateTime, XSSimpleTypeFloat} = require ('./simple/XSSimpleType.js')
const XSSimpleTypeDecimal = require ('./simple/XSSimpleTypeDecimal.js')
const XSSimpleTypeInteger = require ('./simple/XSSimpleTypeInteger.js')

class XMLSchemaBuiltIn extends XMLSchema {

	constructor (parent) {

		const fn = path.join (__dirname, 'xsd.xsd')

		const xml = fs.readFileSync (fn, 'utf-8')

		const doc = parent.parser.process (xml)
		
		super (parent, XMLSchema.namespaceURI, doc) 

	}

	getSimpleTypeClass ({attributes: {name}}) {

		switch (name) {

			case 'QName'   : return XSSimpleTypeQName

			case 'boolean' : return XSSimpleTypeBoolean

			case 'date'    : return XSSimpleTypeDate

			case 'dateTime': return XSSimpleTypeDateTime

			case 'decimal' : return XSSimpleTypeDecimal

			case 'float'   :
			case 'double'  :
							return XSSimpleTypeFloat

			default        : 
				return XSSimpleTypeInteger.byName [name] ?? XSSimpleType

		}

	}	

}

module.exports = XMLSchemaBuiltIn