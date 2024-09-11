const assert       = require ('assert')
const stringEscape = require ('string-escape-map')
const NamespacePrefixesMap = require ('./NamespacePrefixesMap.js')

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

const XML_DECL = [
	['version', '1.0'], 
	['encoding', null], 
	['standalone', null]
]

const _declaration = o => {

	if (typeof o !== 'object' || o === null) return ''

	let s = '<?xml'

	for (const [name, def] of XML_DECL) {
	
		const f = name in o; if (!f && def === null) continue
	
		s += ' ' + name + '="' + (f ? o [name] : def) + '"'

	}

	return s + '?>'

}

const XMLMarshaller = class {

	constructor (xs, localName, namespaceURI) {
	
		this.xs = xs
		
		this.schema = xs.get (namespaceURI); assert (this.schema, 'No schema found for namespaceURI = ' + namespaceURI)

		this.schemaElement = this.schema.get (localName); assert (this.schemaElement, 'No schema element found for namespaceURI = ' + namespaceURI + ', localName = ' + localName)

		this.ns = new NamespacePrefixesMap (xs)
		
		this.isNsDumped = false
		
		this.qNames = []

	}
	
	stringify (data, o = {}) {
	
		const {schemaElement} = this, {targetNamespace, attributes, children} = schemaElement

		if (typeof o === 'string') o = {localName: o}

		this.buf = 'declaration' in o ? _declaration (o.declaration) : ''

		this.appendElement (schemaElement, data, this.ns.QName (o.localName || attributes.name, targetNamespace))

		let xml = this.buf

		delete this.buf

		return xml

	}	
	
	appendElement (node, data, qName) {

		this.appendStartTag (node, data, qName)
		
		this.appendElementBody (node, data)
		
		this.appendEndTag ()

	}
	
	appendStartTag (node, data, qName) {
	
		this.qNames.push (qName)
	
		this.buf += '<' + qName
		
		if (!this.isNsDumped) {
		
			this.buf += this.ns
		
			this.isNsDumped = true

		}
		
		const {type} = node.attributes; if (type) this.appendAttributes (this.xs.getType (type), data)

		this.appendAttributes (node, data)

		this.buf += '>'

	}

	appendEndTag () {

		this.buf += '</' + this.qNames.pop () + '>'

	}

	appendNullElement (node) {
	
		const {attributes: {name, nillable}, targetNamespace} = node
	
		if (BOOL.get (nillable) !== 'true') return
		
		const qName = this.ns.QName (name, targetNamespace)

		this.buf += `<${qName} xsi:nil="true" />`

	}

	appendScalar (node, data, restriction = {}) {
		
		for (const {localName, attributes, children} of node.children) {
		
			if (localName === 'restriction') {
			
				for (const {localName, attributes: {value}} of children) restriction [localName] = value
			
				return this.appendScalar (this.xs.getType (attributes.base), data, restriction)
				
			}
			
		}

		this.buf += this.to_string (data, node.attributes.name, restriction)

	}
	
	appendElementBody (node, data) {

		const {attributes: {type}, children} = node

		if (type) return this.appendContent (this.xs.getType (type), data)

		for (const i of children) this.appendContent (i, data)

	}

	appendAttributes (node, data) {

		const {localName, namespaceURI, attributes, children, targetNamespace} = node, {name, type, ref} = attributes

		if (ref) return this.appendAttributes (this.xs.getByReference (ref), data)
	
		switch (localName) {

			case 'anyAttribute':

				if (data == null || typeof data !== 'object') return

				if (null in data) 
				
					for (const o of Object.values (data [null])) 
					
						for (const [k, v] of Object.entries (o)) 
						
							this.buf += ' ' + k + '="' + XML_ATTR.escape ('' + v) + '"'

				break
			
			case 'attribute':

				if (data == null || typeof data !== 'object') return

				if (!(name in data)) return

				let v = data [name]; if (v == null) return 
				
				this.buf += ' ' + this.ns.QName (name, targetNamespace) + '="'

				if (type) {

					this.appendScalar (this.xs.getType (type), v)

				}
				else {

					for (const child of node.children) if (child.localName === 'simpleType') this.appendScalar (child, v)
							
				}

				this.buf += '"'
				
				break
				
			case 'any':
			case 'sequence':
			case 'choice':
			case 'group':
			case 'simpleType':
			
				return

			case 'extension':
			
				this.appendAttributes (this.xs.getType (attributes.base), data)

			default:

				for (const i of children) this.appendAttributes (i, data)
				
		}
	
	}
	
	appendContent (node, data) {

		const {localName, namespaceURI, attributes, children, targetNamespace} = node, {name, type, ref} = attributes
		
		if (localName === 'attribute') return

		if (ref) return this.appendContent (this.xs.getByReference (ref), data)

		switch (localName) {

			case 'any':
			
				if (null in data) for (const xml in data [null]) this.buf += xml
				
				return

			case 'simpleType':

				if (data !== null && typeof data === 'object' && !(data instanceof Date) && node.attributes.name !== 'QName') data = data [null]

				if (data != null) this.appendScalar (node, data)
				
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

			case 'QName':
				if (typeof v === 'object' && 'localName' in v) v = this.ns.QName (v.localName, v.namespaceURI)

			default:
				return XML_ATTR.escape ('' + v)
			
		}
	
	}
	
}

XMLMarshaller.declaration = _declaration

module.exports = XMLMarshaller