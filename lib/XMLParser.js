const assert      = require ('assert')
const SAXEvent    = require ('./SAXEvent.js')
const XMLNode     = require ('./XMLNode.js')
const XMLIterator = require ('./XMLIterator.js')

const XMLReader = class {

	constructor (options = {}) {
		
		if (!('stripSpace' in options)) options.stripSpace = true
		assert (options.stripSpace === true || options.stripSpace === false, 'options.stripSpace must be boolean, not ' + typeof options.stripSpace)

		if (!('useEntities' in options)) options.useEntities = true
		assert (options.useEntities === true || options.useEntities === false, 'options.useEntities must be boolean, not ' + typeof options.useEntities)

		if (!('useNamespaces' in options)) options.useNamespaces = true
		assert (options.useNamespaces === true || options.useNamespaces === false, 'options.useNamespaces must be boolean, not ' + typeof options.useNamespaces)

		this.stripSpace    = options.stripSpace
		this.useEntities   = options.useEntities
		this.useNamespaces = options.useNamespaces

		if (this.useEntities) this.entityResolver = new (require ('./EntityResolver.js')) ()
		

	}
	
	process (src) {
	
		this.text = ''
		this.document = null
		this.element = null

		const {entityResolver} = this, nodes = new XMLIterator (src, {entityResolver})
		
		for (const node of nodes) {

			let {type} = node

			switch (type) {

				case SAXEvent.TYPES.CHARACTERS:
				case SAXEvent.TYPES.CDATA:

					this.text += node.text					
					continue

				default:

					if (this.text.length === 0) break
					if (this.stripSpace) this.text = this.text.trim ()
					if (this.text.length === 0) break
					(new XMLNode (this.text, this.entityResolver, SAXEvent.TYPES.CHARACTERS)).parent = this.element
					this.text = ''

			}

			switch (type) {
							
				case SAXEvent.TYPES.START_ELEMENT:
					
					node.children = []
					if (this.useNamespaces) node.readNamespaces ()
					node.parent = this.element
					this.element = node
					if (this.document === null) this.document = node
					break

				case SAXEvent.TYPES.END_ELEMENT:

					if (this.element === null) throw new Error (`Unbalanced end element tag "${node.text}" occured at position ${nodes.pos}`)
					this.element.type = type
					this.element = this.element.parent
					break

			}

		}
				
		return this.document

	}

}

module.exports = XMLReader