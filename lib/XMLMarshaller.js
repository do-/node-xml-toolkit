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
	
	stringify (data, name) {
		
		const {schemaElement} = this, {targetNamespace, attributes, children} = schemaElement

		const qName = this.ns.QName (name || attributes.name, targetNamespace)

		this.buf = ['<' + qName]
		
		this.ns.appendTo (this.buf)
		
//		if (complexType) this._aComplexType (buf, complexType, content)

		this.buf [0] += '>'
		
		this.appendElementBody (schemaElement, data)
		
		const xml = this.buf [0] + '</' + qName + '>'

		delete this.buf

		return xml

	}	

	appendNullElement (node) {
	
		const {attributes: {name, nillable}, targetNamespace} = node
	
		if (BOOL.get (nillable) !== 'true') return
		
		const qName = this.ns.QName (name, targetNamespace)

		this.buf [0] += `<${qName} xsi:nil="true" />`

	}
	
	appendScalar (node, data, restriction = {}) {
		
		for (const {localName, attributes, children} of node.children) {

			if (localName === 'restriction') {
			
				for (const {localName, attributes: {value}} of children) restriction [localName] = value
			
				return this.appendScalar (this.xs.getByReference (attributes.base), data, restriction)
				
			}
			
		}

		this.buf [0] += this.to_string (data, node.attributes.name, restriction)

	}
	
	appendElementBody (node, data) {

		const {attributes: {type}, children} = node

		if (type) return this.appendContent (this.xs.getByReference (type), data)

		for (const i of children) this.appendContent (i, data)

	}
	
	appendContent (node, data) {

		const {localName, namespaceURI, attributes, children, targetNamespace} = node, {name, type, ref} = attributes
	
//console.log ({
//localName, 
//namespaceURI,
//targetNamespace, 
//attributes, 
//children, 
//data,
//})	

		if (ref) return this.appendContent (this.xs.getByReference (ref), data)

		switch (localName) {
		
			case 'simpleType':

				return this.appendScalar (node, data)
			
			case 'element':

				if (!(name in data)) return
			
				let v = data [name]; if (v == null) return this.appendNullElement (node)
				
				if (!Array.isArray (v)) v = [v]

				const qName = this.ns.QName (name, targetNamespace)
				
				for (const d of Array.isArray (v) ? v : [v]) {
				
					this.buf [0] += '<' + qName

//					if (complexType) this._aComplexType (buf, complexType, content)

					this.buf [0] += '>'
					
					this.appendElementBody (node, d)
														
					this.buf [0] += '</' + qName + '>'
				
 				}

				break
				
			case 'extension':
			
				this.appendContent (this.xs.getByReference (attributes.base), data)
				
			default:

				for (const i of children) this.appendContent (i, data)
				
		}

	}
	
/*	
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


*/	
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
						if (v.length === 10) return v + 'T00:00:00'
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
/*	

	_bSequence (buf, _sequence, content) {

		const {element, sequence, choice, all, group} = _sequence, g = sequence || choice || all

		if (g) this._bSequence (buf, g, content)

		if (element) {

			for (let e of Array.isArray (element) ? element : [element]) {

				const {ref} = e; if (ref) e = this.xs.getByReference (ref)

				const c = content [e.name]

				this._bElement (buf, e, c)
				
			}
				
		}
		
		if (group) {

			for (let e of Array.isArray (group) ? group : [group]) {

				const {ref} = e; if (ref) e = this.xs.getByReference (ref)

				this._bSequence (buf, e, content)
				
			}
				
		}

	}


*/
}

module.exports = XMLMarshaller