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
		
		const {complexContent} = complexType
		
		if (complexContent) s += this._bComplexContent (complexContent, content, ns)

		return s
	
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
//base...
		if (sequence) s += this._bSequence (sequence, content, ns)

		return s

	}

	_bSequence (sequence, content, ns) {

		let s = ''
		
		const {element} = sequence

console.log ({element, content, ns})

		if (element) {
		
			const v = content [element.name]; if (v != null) {
			}
			
			if (Array.isArray (v)) {
			}
			else {
			}
		
		}

		s += this._bElement (element, content [element.name], ns)

		return s

	}
	
	_bElement (element, content, ns) {
	
		if (content == null) return ''
		
		if (!Array.isArray (content)) content = [content]
		
		if (content.length === 0) return ''
		
		const name = this.QName (element.name, ns)
		
		let s = ''; for (const i of content) {
		
			s += '<' + name
			s += '>'
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