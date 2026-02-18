const assert       = require ('assert')
const NamespacePrefixesMap = require ('./NamespacePrefixesMap.js')
const XMLPrinter = require ('./printer/XMLPrinter.js')
const XMLStreamPrinter = require ('./printer/XMLStreamPrinter.js')
const {Readable} = require ('node:stream')

const XSI_TYPE = Symbol.for ('type')

const XMLMarshaller = class {

	constructor (xs, localName, namespaceURI, printerOptions = {}) {
	
		this.xs = xs
		
		this.schema = xs.get (namespaceURI); assert (this.schema, 'No schema found for namespaceURI = ' + namespaceURI)

		this.schemaElement = this.schema.get (localName); assert (this.schemaElement, 'No schema element found for namespaceURI = ' + namespaceURI + ', localName = ' + localName)

		this.ns = new NamespacePrefixesMap (xs)

		this.isNsDumped = false

		this.printer = new ('out' in printerOptions ? XMLStreamPrinter : XMLPrinter) (printerOptions)

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

			const result = this.appendElement (schemaElement, data, this.ns.QName (o.localName || attributes.name, targetNamespace))

			if (result instanceof Promise) {

				result.then (printer.end, printer.destroy)

			}
			else {

				return printer.text

			}

		}
		catch (cause) {

			const {targetNamespace, attributes: {name}} = schemaElement

			throw Error (`Cannot stringify ${JSON.stringify (data)} as ${name}#{${targetNamespace}}`, {cause})

		}

	}	
	
	appendElement (node, data, qName) {

		this.appendStartTag (node, data, qName)

		const result = this.appendElementBody (node, data), finish = () => this.printer.closeElement ()

		if (!(result instanceof Promise)) return finish ()

		return result.then (finish, this.printer.destroy)

	}
	
	appendStartTag (node, data, qName) {

		this.printer.openElement (qName)

		if (!this.isNsDumped) {
		
			this.printer.write (this.ns.toString ())
		
			this.isNsDumped = true

		}

		if (data && data [XSI_TYPE]) {

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

		if (data && data [XSI_TYPE]) {

			const d = {}; for (let k in data) d [k] = data [k]

			return this.appendContent (this.schema.getType (data [XSI_TYPE]), d)

		}
		else if (type) {

			return this.appendContent (this.xs.getType (type), data)

		}

		return this.appendAllContent (children, data)

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
					this.xs.getAttributeSimpleType (node).stringify (v) // throws
				)

			case 'extension':
			case 'restriction':
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

				const xml = type.stringify (data) // throws
				
				this.printer.writeCharacters (xml)

				return
			
			case 'element':

				if (!(name in data)) return
			
				let v = data [name]; if (v == null) return this.appendNullElement (node)

				const qName = this.ns.QName (name, targetNamespace)
				
				if (v instanceof Readable) return this.printer.forEach (v, d => this.appendElement (node, d, qName))

				if (!Array.isArray (v)) return this.appendElement (node, v, qName)
				
				for (const d of v) this.appendElement (node, d, qName)

				return
				
			case 'extension':

				return this.appendAllContent ([this.xs.getType (attributes.base), ...children], data)

			default:

				return this.appendAllContent (children, data)
				
		}

	}

	appendAllContent (list, data) {

		for (let i = 0; i < list.length; i ++) {

			const result = this.appendContent (list [i], data); if (!(result instanceof Promise)) continue

			return result.then (this.appendAllContent (list.slice (i + 1), data), this.printer.destroy)

		}

	}

}

module.exports = XMLMarshaller