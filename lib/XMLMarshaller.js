const assert       = require ('assert')
const NamespacePrefixesMap = require ('./NamespacePrefixesMap.js')
const XMLPrinter = require ('./XMLPrinter.js')

const XSI_TYPE = Symbol.for ('type')

const XMLMarshaller = class {

	constructor (xs, localName, namespaceURI, printerOptions = {}) {
	
		this.xs = xs
		
		this.schema = xs.get (namespaceURI); assert (this.schema, 'No schema found for namespaceURI = ' + namespaceURI)

		this.schemaElement = this.schema.get (localName); assert (this.schemaElement, 'No schema element found for namespaceURI = ' + namespaceURI + ', localName = ' + localName)

		this.ns = new NamespacePrefixesMap (xs)
		
		this.isNsDumped = false
		
		this.printer = new XMLPrinter (printerOptions)

	}
	
	stringify (data, o = {}) {
	
		const {schemaElement, printer} = this, {targetNamespace, attributes} = schemaElement

		if (typeof o === 'string') o = {localName: o}

		{
			
			const {declaration} = o

			if (declaration) printer.decl = declaration

		}

		printer.reset ()

		try {

			this.appendElement (schemaElement, data, this.ns.QName (o.localName || attributes.name, targetNamespace))

		}
		catch (cause) {

			const {targetNamespace, attributes: {name}} = schemaElement

			throw Error (`Cannot stringify ${JSON.stringify (data)} as ${name}#{${targetNamespace}}`, {cause})

		}

		return printer.text

	}	
	
	appendElement (node, data, qName) {

		this.appendStartTag (node, data, qName)
		
		this.appendElementBody (node, data)
		
		this.printer.closeElement ()

	}
	
	appendStartTag (node, data, qName) {

		this.printer.openElement (qName)

		if (!this.isNsDumped) {
		
			this.printer.text += this.ns
		
			this.isNsDumped = true

		}

		if (data [XSI_TYPE]) {

			let {targetNamespace} = this.xs.getSchemaByLocalName(data [XSI_TYPE])

			this.printer
				.writeAttribute ('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
				.writeAttribute ('xsi:type', this.ns.QName (data [XSI_TYPE], targetNamespace))
		}
		
		this.appendAttributes (node, data)

	}

	appendNullElement (node) {
	
		const {attributes: {name, nillable}, targetNamespace} = node
	
		if (nillable !== 'true' && nillable !== '1') return
		
		const qName = this.ns.QName (name, targetNamespace)

		this.printer
			.openElement (qName)
				.writeAttribute ('xsi:nil', 'true')
			.closeElement ()

	}

	appendElementBody (node, data) {

		const {attributes: {type}, children} = node

		if (data [XSI_TYPE]) {
			let d = {}; for (let k in data) d [k] = data [k]
			this.appendElementBody (this.schema.get (data [XSI_TYPE]), d)
		}

		if (type) return this.appendContent (this.xs.getType (type), data)

		for (const i of children) this.appendContent (i, data)

	}

	appendAttributes (node, data) {

		const {localName, attributes, children, targetNamespace} = node, {name, ref} = attributes

		if (ref) return this.appendAttributes (this.xs.getByReference (ref), data)

		const {type} = node.attributes; if (type) this.appendAttributes (this.xs.getType (type), data)

		switch (localName) {
			
			case 'sequence':
			case 'choice':
			case 'group':
			case 'simpleType':		
				return

			case 'attribute':

				const v = data [name]; if (v == null) return

				return this.printer.writeAttribute (
					this.ns.QName (name, targetNamespace), 
					this.xs.getAttributeSimpleType (node).stringify (v)
				)

			case 'extension':		
				this.appendAttributes (this.xs.getType (attributes.base), data)

			default:
				for (const i of children) this.appendAttributes (i, data)
				
		}
	
	}
	
	appendContent (node, data) {

		const {localName, attributes, children, targetNamespace} = node, {name, ref} = attributes
		
		if (localName === 'attribute') return

		if (ref) return this.appendContent (this.xs.getByReference (ref), data)

		switch (localName) {

			case 'any':
			
				if (null in data) for (const xml in data [null]) this.printer.writeBody (xml)
				
				return

			case 'simpleType':

				if (typeof data === 'object' && data.hasOwnProperty (null)) data = data [null]

				const type = this.xs.getSimpleType (node)

				const xml = type.stringify (data)
				
				this.printer.writeCharacters (xml)

				return
			
			case 'element':

				if (!(name in data)) return
			
				let v = data [name]; if (v == null) return this.appendNullElement (node)

				const qName = this.ns.QName (name, targetNamespace)
				
				if (!Array.isArray (v)) return this.appendElement (node, v, qName)
				
				for (const d of v) this.appendElement (node, d, qName)

				return
				
			case 'extension':
			
				this.appendContent (this.xs.getType (attributes.base), data)
				
			default:

				for (const i of children) this.appendContent (i, data)
				
		}

	}
		
}

module.exports = XMLMarshaller