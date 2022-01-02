const XMLSchema = class extends Map {

	constructor (parent, targetNamespace) {
	
		super ()
	
		this.parent = parent
		this.targetNamespace = targetNamespace
		
		this.isDefaultElementFormQualified   = true
		this.isAttributeElementFormQualified = false

	}
	
	stringify (localName, content) {
						
		const def = this.get (localName)

		const ns = this.parent.getNamespacePrefixesMap (def)
		
		const name = ns.get (this.targetNamespace) + ':' + localName
		
		let s = '<' + name
		
		for (let [k, v] of ns.entries ()) s += ' xmlns:' + v + '="' + k + '"'

		s += '>'

		return s + '</' + name + '>'

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