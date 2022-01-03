const assert       = require ('assert')
const stringEscape = require ('string-escape-map')

let esc = [
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['&', '&amp;'],
]

const XML_BODY = new stringEscape (esc)

esc.push (['"', '&quot;'])

const XML_ATTR = new stringEscape (esc)

const XMLMarshaller = class {

	constructor (xs, localName, namespaceURI) {
	
		this.xs = xs
		
		this.schema = xs.get (namespaceURI); assert (this.schema, 'No schema found for namespaceURI = ' + namespaceURI)

		this.schemaElement = this.schema.get (localName); assert (this.schemaElement, 'No schema element found for namespaceURI = ' + namespaceURI + ', localName = ' + localName)

		this.ns = this.xs.getNamespacePrefixesMap (this.schemaElement)

	}
	
	stringify (content) {
								
		const qName = this.ns.QName (this.schemaElement.name, this.schema.targetNamespace)
		
		let buf = ['<' + qName]
		
		this.ns.appendTo (buf)
		
		buf [0] += '>'
		
		const {complexType} = this.schemaElement
		
		if (complexType) this._bComplexType (buf, complexType, content)

		return buf [0] + '</' + qName + '>'

	}	
	
	_bComplexType (buf, complexType, content) {
		
		const {complexContent, sequence} = complexType
		
		if (sequence)       this._bSequence       (buf, sequence, content)
		if (complexContent) this._bComplexContent (buf, complexContent, content)
	
	}

	_bSimpleType (buf, simpleType, content) {

		const {restriction} = simpleType

		if (restriction)    this._bRestriction    (buf, restriction, content)
	
	}

	_bRestriction (buf, restriction, content) {

		buf [0] += XML_BODY.escape ('' + content)
	
	}
	
	_bComplexContent (buf, complexContent, content) {
			
		const {extension} = complexContent

		if (extension) this._bExtension (buf, extension, content)
		
	}
	
	_bExtension (buf, extension, content) {
		
		const {base, sequence} = extension

		if (base) {
		
			const [localName, namespaceURI] = base
		
			const schema = this.xs.get (namespaceURI)
		
			const type = schema.get (localName)
			
			if (type._type === 'complexType') this._bComplexType (buf, type, content)
					
		}

		if (sequence) this._bSequence (buf, sequence, content)

	}

	_bSequence (buf, sequence, content) {
		
		const {element} = sequence

		if (element) 
		
			for (const e of Array.isArray (element) ? element : [element])
		
				this._bElement (buf, e, content [e.name])

	}
	
	_bElement (buf, element, content) {

		if (content == null) return '' // TODO: xsi:nil
		
		if (!Array.isArray (content)) content = [content]
		
		if (content.length === 0) return ''
//console.log ({element})		
		let {name, targetNamespace, complexType, simpleType, type} = element
		
		if (type) {

			type = this.xs.getByReference (type)

			switch (type._type) {

				case 'complexType':
					complexType = type
					break

				case 'simpleType':
					simpleType = type
					break

			}

		}

		const qName = this.ns.QName (name, targetNamespace)
		
		for (const i of content) {
		
			buf [0] += '<' + qName
			buf [0] += '>'
			
			if (complexType) this._bComplexType (buf, complexType, i)
			if (simpleType)  this._bSimpleType  (buf, simpleType, i)
			
			buf [0] += '</' + qName + '>'

		}
			
	}

}

module.exports = XMLMarshaller