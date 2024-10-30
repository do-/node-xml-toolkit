const {XSSimpleType} = require ('./XSSimpleType.js')

const TYPES = Symbol ('_types')

const FORM_U = 'unqualified'
const FORM_Q =   'qualified'

const adjustNode = node => {

	node.children = node.children
		.filter (i => i.localName !== 'annotation')
		.map (node => adjustNode (node))

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

const XMLSchema = class extends Map {

	static namespaceURI = 'http://www.w3.org/2001/XMLSchema'

	constructor (parent, targetNamespace, node) {
	
		super ()

		if (targetNamespace === XMLSchema.namespaceURI) this.getSimpleTypeClass = node => XSSimpleType.forName (node.attributes.name)

		this.formDefault = {}

		this [TYPES] = new Map ()

		{(this.parent = parent).set (this.targetNamespace = targetNamespace, this)}

		this.setSource (node)

	}
	
	getType (localName) {

		return this [TYPES].get (localName)

	}

	setSource (node) {

		node = adjustNode (node).detach ()
			
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

		this._src = node

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

module.exports = XMLSchema