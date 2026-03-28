const {XSINamespace} = require ('../NamespacesMap')

class XMLValidationState {

	#child = null
	#hadText = false

	constructor (parent, parsedNode, elementDefinition) {

		this.xs = (this.parent = parent).xs
		this.parsedNode = parsedNode
		
		try {

			this.setTypeFrom (elementDefinition)

		}
		catch (cause) {

			this.warn (cause.message)

		}

	}

	warn (message, cause) {

		this.parent.warn (message, cause)

	}

	setTypeFrom (element) {

		const {xs} = this

		const typeDefinition = xs.getTypeDefinition (element)

		this.anyType = xs.getAnyType (typeDefinition)

		this.validateAttributes (this.parsedNode.attributes)

		const {content} = this.anyType; if (content) this.match = content.createMatch ()

	}

	blameNothingExpected () {

		this.warn (`No nested elements allowed inside ${this.parsedNode.src}`)

	}

	blameUnexpectedTag (parsedNode, match) {

		const expected = match.allExpected (parsedNode); if (expected == null) this.blameNothingExpected ()

		this.warn (`is unexpected here; should be ${expected}`)

	}

	startElement (parsedNode) {

		if (this.#child !== null) return this.#child.startElement (parsedNode)

		const {match} = this; if (!match) this.warn (`No nested elements allowed inside ${this.anyType.debugQName}`)

		const element = match.getElementDefinition (parsedNode); if (!element) this.blameUnexpectedTag (parsedNode, match)

		if (element.localName === 'any') return

		this.#child = new XMLValidationState (this, parsedNode, element)

	}

	endElement (parsedNode) {

		if (this.#child === null) {

			if (!this.#hadText) this.characters ('')

			const {match} = this; if (match && !match.isSatisfied) this.blameUnexpectedTag (parsedNode, match)
			
			return null

		}

		this.#child = this.#child.endElement (parsedNode)

		return this

	}

	characters (text) {

		if (this.#child !== null) return this.#child.characters (text)

		this.#hadText = true

		try {

			this.anyType.asSimpleType ().validateScalar (text)

		}
		catch (cause) {

			this.warn (cause.message)

		}

	}

	resolveAttribute (name, attributesMap) {

		const {attributes} = this.anyType

		if (attributes.has (name)) {

			const def = attributes.get (name)

			if (!def.targetNamespace || def.targetNamespace === attributesMap.getNamespaceURI (name)) return def

		}

		const localName = attributesMap.getLocalName (name); if (localName === name) return null

		const def = attributes.get (localName); if (!def) return null

		if (def.targetNamespace !== attributesMap.getNamespaceURI (name)) return null

		return def

	}

	validateAttributes (attributesMap) {

		const {attributes, isAnyAttributeAllowed} = this.anyType

		const matched = new Set ()

		for (const [name, value] of attributesMap) {

			const def = this.resolveAttribute (name, attributesMap)

			if (!def) {

				if (isAnyAttributeAllowed) continue

				if (attributesMap.getNamespaceURI (name) === XSINamespace) continue

				this.warn (`Unknown attribute: "${name}"`)

			}

			matched.add (def)

			const {attributes: {fixed, type}} = def

			if (typeof fixed === 'string' && value !== fixed) this.warn (`The attribute "${name}" must have the value "${fixed}", not "${value}"`)

			const validateBy = typeNode => {

				try {

					this.xs.getSimpleType (typeNode).validateScalar (value)

				}
				catch (cause) {

					this.warn (`attribute '${name}": ${cause.message}`)

				}

			}

			if (type) {

				validateBy (this.xs.getType (type))

			}
			else {

				for (const node of def.children) validateBy (node)

			}

		}

		for (const [name, def] of attributes) if (!matched.has (def)) {

			if (def.attributes.use === 'required') this.warn (`Missing required attribute: "${name}"`)

			if ('default' in def.attributes) attributesMap.set (name, def.attributes.default)

		}

	}

}

module.exports = XMLValidationState