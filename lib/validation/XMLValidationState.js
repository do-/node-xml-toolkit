class XMLValidationState {

	#child = null
	#hadText = false

	constructor (parent, parsedNode) {

		this.xs = (this.parent = parent).xs
		this.parsedNode = parsedNode
		
		try {

			this.setTypeFrom (this.parent.getChildElement (parsedNode))			

		}
		catch (cause) {

			throw Error (`Validation problem with ${parsedNode.src} at position ${this.getPosition ()}: ${cause.message}`, {cause})

		}

	}

	get getPosition () {
		
		return this.parent.getPosition 
	
	}

	setTypeFrom (element) {

		if (element === null) return

		const {xs} = this

		const typeDefinition = xs.getTypeDefinition (element)

		this.anyType = xs.getAnyType (typeDefinition)

		this.validateAttributes (this.parsedNode.attributes)

	}

	getChildElement (parsedNode) {

		if (!('anyType' in this)) return null

		const {namespaceURI, localName} = parsedNode, {anyType} = this, {elements} = this.anyType, {length} = elements; if (length === 0) throw Error (`No nested elements allowed inside ${anyType.debugQName}`)

		for (let i = 0; i < elements.length; i ++) {

			const element = elements [i]; if (element.localName === 'any') return null

			if (element.attributes.name !== localName || element.targetNamespace != namespaceURI) continue

			return element

		}

		throw Error (`Unexpected element`)

	}

	startElement (parsedNode) {

		if (this.#child === null) return this.#child = new XMLValidationState (this, parsedNode)

		this.#child.startElement (parsedNode)

	}

	characters (text) {

		if (this.#child !== null) return this.#child.characters (text)

		this.#hadText = true

		try {

			if ('anyType' in this) this.anyType.asSimpleType ().validateScalar (text)

		}
		catch (cause) {
			
			throw Error (`Validation problem with the contents of <${this.parsedNode.name}...> at position ${this.getPosition ()}: ${cause.message}`, {cause})

		}

	}

	endElement () {

		if (this.#child === null) {

			if (!this.#hadText) this.characters ('')
			
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