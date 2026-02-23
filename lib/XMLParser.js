const SAXEvent      = require ('./SAXEvent.js')
const XMLNode       = require ('./XMLNode.js')
const XMLIterator   = require ('./XMLIterator.js')
const XMLValidatior = require ('./XMLValidatior.js')

const XMLParser = class {

	constructor (options = {}) {

		if ('xs' in options) {

			const {xs} = options; if (!(xs instanceof Map && xs.constructor.name === 'XMLSchemata')) throw Error (`options.xs must be an XMLSchemata instance, found ${typeof xs} '${xs}'`)

			this.xs = xs

		}
		else {

			this.xs = null

		}

		for (const k of ['stripSpace', 'useEntities', 'useNamespaces']) {

			if (!(k in options)) options [k] = true

			switch (options [k]) {
				case false:
					if (this.xs !== null && k === 'useNamespaces') throw Error (`With an XMLSchema provided, options.${k} cannot be false`)
				case true:
					break
				default:
					throw Error (`options.${k} must be boolean, found ${typeof options [k]} '${options [k]}'`)
			}

		}
		
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
					(new XMLNode (this.text, null, SAXEvent.TYPES.CHARACTERS)).parent = this.element
					this.text = ''

			}

			switch (type) {
							
				case SAXEvent.TYPES.START_ELEMENT:
					
					node.parent = this.element
					if (this.useNamespaces) node.readNamespaces ()
					this.element = node
					if (this.document === null) {
						this.document = node
						if (this.xs !== null) this.validator = new XMLValidatior (this.xs, node, () => nodes.pos)
					}
					else {
						if (this.xs !== null) this.validator.startElement (node)
					}
					break

				case SAXEvent.TYPES.END_ELEMENT:

					if (this.element === null) throw new Error (`Unbalanced end element tag "${node.text}" occured at position ${nodes.pos}`)
					this.element.type = type
					this.element = this.element.parent
					if (this.xs !== null) this.validator.endElement (node)
					break

			}

		}
				
		return this.document

	}

}

module.exports = XMLParser