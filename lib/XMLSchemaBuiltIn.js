const fs = require ('fs')
const path = require ('path')

const XMLSchema = require ('./XMLSchema.js')
const {XSSimpleType, XSSimpleTypeDate, XSSimpleTypeDateTime} = require ('./simple/XSSimpleType.js')
const XSSimpleTypeDecimal = require ('./simple/XSSimpleTypeDecimal.js')
const XSSimpleTypeInteger = require ('./simple/XSSimpleTypeInteger.js')
const XSSimpleTypeBoolean = require ('./simple/XSSimpleTypeBoolean.js')
const XSSimpleTypeFloat = require ('./simple/XSSimpleTypeFloat.js')
const XSSimpleTypeQName = require ('./simple/XSSimpleTypeQName.js')

class XMLSchemaBuiltIn extends XMLSchema {

	constructor (parent) {

		const fn = path.join (__dirname, 'xsd.xsd')

		const xml = fs.readFileSync (fn, 'utf-8')

		const doc = parent.parser.process (xml)
		
		super (parent, XMLSchema.namespaceURI, doc)

		this.byName = {
			...XSSimpleTypeInteger.byName,
			QName   : XSSimpleTypeQName,
			boolean : XSSimpleTypeBoolean,
			date    : XSSimpleTypeDate,
			dateTime: XSSimpleTypeDateTime,
			decimal : XSSimpleTypeDecimal,
			float   : XSSimpleTypeFloat,
			double  : XSSimpleTypeFloat,
		}

	}

	getSimpleTypeClass ({attributes: {name}}) {

		return this.byName [name] ?? XSSimpleType

	}	

}

module.exports = XMLSchemaBuiltIn