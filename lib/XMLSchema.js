const XMLSchema = class extends Map {

	constructor (parent, targetNamespace) {
	
		super ()
	
		this.parent = parent
		this.targetNamespace = targetNamespace
		
		this.isDefaultElementFormQualified   = true
		this.isAttributeElementFormQualified = false

	}

	add (node, options = {}) {
		
		this.copyTargetNamespace (node)
	
		const {attributes, children} = node

		if (attributes.elementFormDefault === 'unqualified') this.isDefaultElementFormQualified = false
		if (attributes.attributeFormDefault === 'qualified') this.isAttributeElementFormQualified = true
		
		for (const e of children) {
		
			const {attributes} = e; if (!('name' in attributes)) continue
			
			const {name} = attributes

			this.set (name, e)
			
			this.parent.register (name, this.targetNamespace)
		
		}

	}
	
	copyTargetNamespace (node) {

		if (typeof node !== 'object') return		

		node.targetNamespace = this.targetNamespace
			
		for (const e of node.children) this.copyTargetNamespace (e)
	
	}

}

XMLSchema.adjustNode = node => {

	if (node.children) node.children = node.children.filter (i => i.localName !== 'annotation')
	
	const {attributes, namespacesMap} = node, splitNs = name => {
		
		if (!attributes.has (name)) return
	
		const [local, prefix] = attributes.get (name).split (':').reverse ()
		
		attributes.set (name, [local, namespacesMap.get (prefix || '')])
	
	}

	switch (node.localName) {

		case 'attribute':
		case 'element':
		case 'group':
			splitNs ('ref')
			splitNs ('type')
			break

		case 'extension':
		case 'restriction':
			splitNs ('base')
			break

	}

	return node

}

XMLSchema.namespaceURI = 'http://www.w3.org/2001/XMLSchema'

module.exports = XMLSchema