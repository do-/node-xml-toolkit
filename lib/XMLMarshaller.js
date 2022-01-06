const assert       = require ('assert')
const stringEscape = require ('string-escape-map')

let esc = [
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['&', '&amp;'],
  ['"', '&quot;']
]

//const XML_BODY = new stringEscape (esc)

//esc.push (['"', '&quot;'])

const XML_ATTR = new stringEscape (esc)

const BOOL = new Map ([
	['0',     'false'],
	['false', 'false'],
	['N',     'false'],
	['1',     'true'],
	['true',  'true'],
	['Y',     'true'],
])

const XMLMarshaller = class {

	constructor (xs, localName, namespaceURI) {
	
		this.xs = xs
		
		this.schema = xs.get (namespaceURI); assert (this.schema, 'No schema found for namespaceURI = ' + namespaceURI)

		this.schemaElement = this.schema.get (localName); assert (this.schemaElement, 'No schema element found for namespaceURI = ' + namespaceURI + ', localName = ' + localName)

		this.ns = this.xs.getNamespacePrefixesMap (this.schemaElement)

	}
	
	stringify (content) {
								
		const qName = this.ns.QName (this.schemaElement.name, this.schema.targetNamespace)

		const {complexType} = this.schemaElement

		let buf = ['<' + qName]
		
		this.ns.appendTo (buf)
		
		if (complexType) this._aComplexType (buf, complexType, content)

		buf [0] += '>'
		
		if (complexType) this._bComplexType (buf, complexType, content)

		return buf [0] + '</' + qName + '>'

	}	
	
	/// _a: attributes
	
	_aComplexType (buf, complexType, content) {
		
		const {complexContent, attribute} = complexType

		if (attribute) 		
			for (const e of Array.isArray (attribute) ? attribute : [attribute])		
				this._aAttribute (buf, e, content [e.name])
		
		if (complexContent) this._aComplexContent (buf, complexContent, content)
	
	}	
	
	_aComplexContent (buf, complexContent, content) {
			
		const {extension} = complexContent

		if (extension) this._aExtension (buf, extension, content)
		
	}
	
	_aExtension (buf, extension, content) {
		
		const {base, attribute} = extension

		if (base) {
		
			const [localName, namespaceURI] = base
		
			const schema = this.xs.get (namespaceURI)
		
			const type = schema.get (localName)
			
			if (type._type === 'complexType') this._aComplexType (buf, type, content)
					
		}

		if (attribute) 		
			for (const a of Array.isArray (attribute) ? attribute : [attribute])		
				this._aAttribute (buf, a, content [a.name])

	}	
	
	_aAttribute (buf, attribute, content) {

		if (content == null) return

		let {name, targetNamespace, simpleType, type} = attribute
		
		if (type) {

			type = this.xs.getByReference (type)

			switch (type._type) {

				case 'simpleType':
					simpleType = type
					break

			}

		}

		const qName = this.ns.QName (name, targetNamespace)
		
		buf [0] += ' ' + qName + '="'
			
		if (simpleType)  this._bSimpleType  (buf, simpleType, content)
			
		buf [0] += '"'
			
	}	
	
	/// _b: body	
	
	_bComplexType (buf, complexType, content) {

		const {complexContent, sequence, choice, all} = complexType, group = sequence || choice || all

		if (group)          this._bSequence       (buf, group, content)
		if (complexContent) this._bComplexContent (buf, complexContent, content)
	
	}

	_bSimpleType (buf, simpleType, content, _restriction = {}) {
	
		let {restriction} = simpleType; if (restriction) {

			for (const [k, v] of Object.entries (_restriction)) switch (k) {				
				case 'base': case 'targetNamespace': break
				default: restriction [k] = v
			}
			
			this._bSimpleType (buf, this.xs.getByReference (restriction.base), content, restriction)

		}
		else {

			buf [0] += this.to_string (content, simpleType.name, _restriction)

		}
	
	}
	
	to_string (v, type, restriction = {}) {
		
		const carp = () => {throw new Error (`Invalid value for ${type} type: ${v} (${typeof v})`)}
	
		switch (type) {
		
			case 'boolean':
				if (BOOL.has (v)) return BOOL.get (v)
				return !v ? 'false' : 'true'

			case 'date':
				switch (typeof v) {
					case 'string':
						if (v.length === 10) return v
					case 'number':
					case 'bigint':
						const d = new Date (v)
						if (isNaN (d)) carp ()
						v = d
				}
				if (v instanceof Date) {
					return v.toJSON ().slice (0, 10)
				}
				else {
					carp ()
				}
				
			case 'dateTime':
				switch (typeof v) {
					case 'string':
						return v
					case 'number':
					case 'bigint':
						v = new Date (v)
				}
				if (v instanceof Date) {
					return v.toJSON ()
				}
				else {
					carp ()
				}

			case 'integer':
			case 'nonNegativeInteger':
			case 'positiveInteger':
			case 'nonPositiveInteger':
			case 'negativeInteger':
			case 'long':
				if (typeof v === 'string') v = BigInt (v)
				switch (typeof v) {
					case 'number':
					case 'bigint':
						return '' + v
				}
				carp ()

			case 'int':
			case 'short':
			case 'byte':
			case 'unsignedLong':
			case 'unsignedInt':
			case 'unsignedShort':
			case 'unsignedByte':
				if (typeof v === 'string') v = parseInt (v)
				switch (typeof v) {
					case 'number':
						if (!Number.isInteger (v)) carp ()
					case 'bigint':
						return '' + v
				}
				carp ()

			case 'float':
			case 'double':
				if (typeof v === 'string') v = parseFloat (v)
				if (typeof v === 'number') switch (v) {
					case Number.POSITIVE_INFINITY: return 'INF'
					case Number.NEGATIVE_INFINITY: return '-INF'
					default: return '' + v
				}
				carp ()

			case 'decimal':
				const {fractionDigits} = restriction
				if (typeof v === 'string') v = parseFloat (v)
				if (typeof v === 'number') return fractionDigits ? v.toFixed (fractionDigits.value) : '' + v
				carp ()

			default:
				return XML_ATTR.escape ('' + v)
			
		}
	
	}
	
	_bComplexContent (buf, complexContent, content) {
			
		const {extension} = complexContent

		if (extension) this._bExtension (buf, extension, content)
		
	}
	
	_bExtension (buf, _extension, content) {
		
		const {base, sequence, choice, all} = _extension, group = sequence || choice || all

		if (base) {
		
			const [localName, namespaceURI] = base
		
			const schema = this.xs.get (namespaceURI)
		
			const type = schema.get (localName)
			
			if (type._type === 'complexType') this._bComplexType (buf, type, content)
					
		}

		if (group) this._bSequence (buf, group, content)

	}

	_bSequence (buf, _sequence, content) {
		
		const {element, sequence, choice, all} = _sequence, group = sequence || choice || all

		if (group) this._bSequence (buf, group, content)

		if (element) {
		
			for (const e of Array.isArray (element) ? element : [element])
		
				this._bElement (buf, e, content [e.name])
				
		}

	}
	
	_bElement_null (buf, element) {
	
		if (BOOL.get (element.nillable) !== 'true') return
		
		const {name, targetNamespace} = element, qName = this.ns.QName (name, targetNamespace)

		buf [0] += `<${qName} xsi:nil="true" />`

	}
	
	_bElement (buf, element, content) {

		if (content == null) return this._bElement_null (buf, element)
		
		if (!Array.isArray (content)) content = [content]
		
		if (content.length === 0) return

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

			if (complexType) this._aComplexType (buf, complexType, content)
			
			buf [0] += '>'
			
			if (complexType) this._bComplexType (buf, complexType, i)
			if (simpleType)  this._bSimpleType  (buf, simpleType, i)
			
			buf [0] += '</' + qName + '>'

		}
			
	}

}

module.exports = XMLMarshaller