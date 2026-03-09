class XMLValidationState {

	#child = null
	#hadText = false

	constructor (parent, parsedNode) {

		this.parent = parent
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

	get validator ()   {
		
		return this.parent.validator 
	
	}

	setTypeFrom (element) {

		if (element === null) return

		const {xs} = this.validator

		const typeDefinition = xs.getTypeDefinition (element)

		this.anyType = xs.getAnyType (typeDefinition)

		this.anyType.validateAttributes (this.parsedNode.attributes)

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

	checkText (text) {

		this.#hadText = true

		try {

			if ('anyType' in this) this.anyType.asSimpleType ().validateScalar (text)

		}
		catch (cause) {
			
			throw Error (`Validation problem with the contents of <${this.parsedNode.name}...> at position ${this.getPosition ()}: ${cause.message}`, {cause})

		}

	}

	startElement (parsedNode) {

		if (this.#child === null) return this.#child = new XMLValidationState (this, parsedNode)

		this.#child.startElement (parsedNode)

	}

	characters (text) {

		if (this.#child === null) return this.checkText (text)

		this.#child.characters (text)

	}

	endElement () {

		if (this.#child === null) {

			if (!this.#hadText) this.characters ('')
			
			return null

		}

		this.#child = this.#child.endElement ()

		return this

	}


}

module.exports = XMLValidationState