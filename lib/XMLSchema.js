const TYPES = Symbol ('_types')

const FORM_U = 'unqualified'
const FORM_Q =   'qualified'

const XMLSchema = class extends Map {

	constructor (parent, targetNamespace) {
	
		super ()
	
		this.parent = parent
		
		this.targetNamespace = targetNamespace
		
		this.formDefault = {}
		
		this [TYPES] = new Map ()

	}
	
	getType (localName) {
		return this [TYPES].get (localName)
	}

	add (node) {
			
		const {attributes, children} = node
		
		for (const name of ['element', 'attribute']) this.formDefault [name] = attributes [name + 'FormDefault'] || FORM_U

		this.copyTargetNamespace (node)
		
		for (const e of children) {

			const {localName, attributes} = e; if (!('name' in attributes)) continue
			
			const {name} = attributes
			
			switch (localName) {
				case 'complexType':
				case 'simpleType':
					this [TYPES].set (name, e)
					break
				default:
					this.set (name, e)
			}
			
			this.parent.register (name, this.targetNamespace)
		
		}

	}
	
	copyTargetNamespace (node, force = false) {

		if (typeof node !== 'object') return		
		
		const {localName} = node
		
		for (const e of node.children) this.copyTargetNamespace (e, localName === 'schema')
		
		if ('targetNamespace' in node) return
		
		const {formDefault} = this; if (!(localName in formDefault)) return
		
		if (!force) {
		
			const {form} = node.attributes
						
			if (form !== FORM_Q && formDefault [localName] !== FORM_Q) return
		
		}

		node.targetNamespace = this.targetNamespace		
	
	}

	getSimpleTypeClass (node) {

		return this.parent.getSimpleTypeClass (node)

	}

}

XMLSchema.adjustNode = (node, recurse) => {

	if (node.children) {
	
		node.children = node.children.filter (i => i.localName !== 'annotation')

		if (recurse) node.children = node.children.map (node => XMLSchema.adjustNode (node, true))

	}

	const {attributes, namespacesMap} = node, splitNs = name => {
		
		if (!attributes.has (name)) return
		
		const v = attributes.get (name); if (Array.isArray (v)) return

		const [local, prefix] = v.split (':').reverse ()
		
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