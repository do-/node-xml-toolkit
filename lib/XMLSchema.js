const XMLSchema = class extends Map {

	constructor (parent, targetNamespace) {
	
		super ()
	
		this.parent = parent
		this.targetNamespace = targetNamespace
		
		this.isDefaultElementFormQualified   = true
		this.isAttributeElementFormQualified = false

	}
	
	QName (localName, ns) {
	
		return ns.QName (localName, this.targetNamespace)

	}
	
	stringify (localName, content) {
						
		const def = this.get (localName)

		const ns = this.parent.getNamespacePrefixesMap (def)
		
		const name = this.QName (localName, ns)
		
		let s = '<' + name
		
		for (let [k, v] of ns.entries ()) s += ' xmlns:' + v + '="' + k + '"'

		s += '>'
		
		const {complexType} = def
		
		if (complexType) s += this._bComplexType (complexType, content, ns)

		return s + '</' + name + '>'

	}	
	
	_bComplexType (complexType, content, ns) {

		let s = ''
		
		const {complexContent, sequence} = complexType
		
		if (sequence)       s += this._bSequence       (sequence, content, ns)
		if (complexContent) s += this._bComplexContent (complexContent, content, ns)

		return s
	
	}

	_bSimpleType (simpleType, content, ns) {

		const {restriction} = simpleType

		let s = ''

		if (restriction)       s += this._bRestriction       (restriction, content, ns)

		return s
	
	}

	_bRestriction (restriction, content, ns) {

		return '' + content
	
	}
	
	_bComplexContent (complexContent, content, ns) {
	
		let s = ''
		
		const {extension} = complexContent

		if (extension) s += this._bExtension (extension, content, ns)

		return s
	
	}
	
	_bExtension (extension, content, ns) {

		let s = ''
		
		const {base, sequence} = extension

		if (base) {
		
			const [localName, namespaceURI] = base
		
			const schema = this.parent.get (namespaceURI)
		
			const type = schema.get (localName)
			
			if (type._type === 'complexType') s += schema._bComplexType (type, content, ns)
					
		}

		if (sequence) s += this._bSequence (sequence, content, ns)

		return s

	}

	_bSequence (sequence, content, ns) {

		let s = ''
		
		const {element} = sequence

		if (element) 
		
			for (const e of Array.isArray (element) ? element : [element])
		
				s += this._bElement (e, content [e.name], ns)

		return s

	}
	
	_bElement (element, content, ns) {

		if (content == null) return ''
		
		if (!Array.isArray (content)) content = [content]
		
		if (content.length === 0) return ''
		
		let {complexType, simpleType, type} = element
		
		if (type) {

			type = this.parent.getByReference (type)

			switch (type._type) {

				case 'complexType':
					complexType = type
					break

				case 'simpleType':
					simpleType = type
					break

			}

		}
		
		const name = this.QName (element.name, ns)
		
		let s = ''; for (const i of content) {
		
			s += '<' + name
			s += '>'
			
			if (complexType) s += this._bComplexType (complexType, i, ns)
			if (simpleType) s += this._bSimpleType (simpleType, i, ns)
			
			s += '</' + name + '>'

		}
		
		return s
	
	}

	add (node, options = {}) {

		if (node.elementFormDefault === 'unqualified') this.isDefaultElementFormQualified = false
		if (node.attributeFormDefault === 'qualified') this.isAttributeElementFormQualified = true

		for (const type of [

			'element',
			'complexType',
			'simpleType',

		]) if (type in node) {

			let list = node [type]

			if (!Array.isArray (list)) list = [list]

			for (const item of list) {
			
				delete item.annotation
				
				item._type = type
			
				this.set (item.name, item)
				
				this.parent.register (item.name, this.targetNamespace)
				
			}

		}
		
	}
	
}

XMLSchema.adjustNode = node => {

	if (node.children) node.children = node.children.filter (i => i.localName !== 'annotation')
	
	const {attributes, namespacesMap} = node, splitNs = name => {
		
		if (!attributes.has (name)) return
	
		const [local, prefix] = attributes.get (name).split (':').reverse ()
		
		attributes.set (name, [local, namespacesMap.get (prefix)])
	
	}

	switch (node.localName) {

		case 'attribute':
		case 'element':
			splitNs ('type')
			break

		case 'extension':
		case 'restriction':
			splitNs ('base')
			break

	}
	
	return node

}

module.exports = XMLSchema