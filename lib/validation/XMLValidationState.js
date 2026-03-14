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

			throw Error (`Validation problem with ${parsedNode.src} at position ${this.getPosition ()}: ${cause.message}`, {cause})

		}

	}

	get getPosition () {
		
		return this.parent.getPosition 
	
	}

	setTypeFrom (element) {

		const {xs} = this

		const typeDefinition = xs.getTypeDefinition (element)

		this.anyType = xs.getAnyType (typeDefinition)

		this.validateAttributes (this.parsedNode.attributes)

		const {content} = this.anyType; if (content) this.match = content.createMatch ()

	}

	startElement (parsedNode) {

		if (this.#child !== null) return this.#child.startElement (parsedNode)

		const {match} = this; if (!match) throw Error (`No nested elements allowed inside ${this.anyType.debugQName}`)

		const element = match.getElementDefinition (parsedNode); if (!element) throw Error (`Unexpected element <${parsedNode.name}...> at position ${this.getPosition ()}, expected: ${[...match.expected ()].map (i => JSON.stringify (i.attributes))}`)

		if (element.localName === 'any') return null

		this.#child = new XMLValidationState (this, parsedNode, element)

	}

	characters (text) {

		if (this.#child !== null) return this.#child.characters (text)

		this.#hadText = true

		try {

			this.anyType.asSimpleType ().validateScalar (text)

		}
		catch (cause) {
			
			throw Error (`Validation problem with the contents of <${this.parsedNode.name}...> at position ${this.getPosition ()}: ${cause.message}`, {cause})

		}

	}

	endElement () {

		if (this.#child === null) {

			if (!this.#hadText) this.characters ('')

			const {match} = this; if (match && !match.isSatisfied) throw Error (`Unexpected closing </${this.parsedNode.name}> at position ${this.getPosition ()}, expected: ${[...match.expected ()].map (i => JSON.stringify (i.attributes))}`)
			
			return null

		}

		this.#child = this.#child.endElement ()

		return this

	}

	validateAttributes (attributesMap) {

		const {attributes, isAnyAttributeAllowed} = this.anyType

		for (const [name, value] of attributesMap) {

			if (!attributes.has (name)) {

				if (isAnyAttributeAllowed) continue

				throw Error (`Unknown attribute: "${name}"`)

			}
			
			const def = attributes.get (name), {attributes: {fixed, type}} = def

			if (typeof fixed === 'string' && value !== fixed) throw Error (`The attribute "${name}" must have the value "${fixed}", not "${value}"`)

			const validateBy = typeNode => {

				try {

					this.xs.getSimpleType (typeNode).validateScalar (value)

				}
				catch (cause) {

					throw Error (`attribute '${name}": ${cause.message}`, {cause})

				}

			}

			if (type) {

				validateBy (this.xs.getType (type))

			}
			else {

				for (const node of def.children) validateBy (node)

			}

		}

		for (const [name, def] of attributes) if (!attributesMap.has (name)) {

			if (def.attributes.use === 'required') throw Error (`Missing required attribute: "${name}"`)

			if ('default' in def.attributes) attributesMap.set (name, def.attributes.default)

		}

	}

}

module.exports = XMLValidationState