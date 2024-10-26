const assert       = require ('assert')
const NamespacePrefixesMap = require ('./NamespacePrefixesMap.js')
const XMLPrinter = require ('./XMLPrinter.js')

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

		this.appendElement (schemaElement, data, this.ns.QName (o.localName || attributes.name, targetNamespace))

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
		
		const {type} = node.attributes; if (type) this.appendAttributes (this.xs.getType (type), data)

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

		if (type) return this.appendContent (this.xs.getType (type), data)

		for (const i of children) this.appendContent (i, data)

	}

	appendAttributes (node, data) {

		const {localName, attributes, children, targetNamespace} = node, {name, ref} = attributes

		if (ref) return this.appendAttributes (this.xs.getByReference (ref), data)
	
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
				return this.appendAttributes (this.xs.getType (attributes.base), data)

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

				if (data !== null && typeof data === 'object' && !(data instanceof Date) && node.attributes.name !== 'QName') data = data [null]
				
				if (data != null) this.printer.writeCharacters (this.xs.getSimpleType (node).stringify (data))

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