class XMLValidattionState {

	get getPosition () {return this.parent.getPosition }

	constructor (validator, parent, parsedNode) {

		this.validator  = validator		
		this.parent = parent ?? validator
		this.parsedNode = parsedNode
		
		try {

			const {xs} = validator

			const elementDefinifion = this.parent.getChildElement (parsedNode)
			
			if (elementDefinifion === null) return

			const typeDefinition = xs.getTypeDefinition (elementDefinifion)

			this.anyType = xs.getAnyType (typeDefinition)

			this.anyType.validateAttributes (parsedNode.attributes)

		}
		catch (cause) {

			throw Error (`Validation problem with ${parsedNode.src} at position ${this.getPosition ()}: ${cause.message}`, {cause})

		}

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

		try {

			if ('anyType' in this) this.anyType.asSimpleType ().validateScalar (text)

		}
		catch (cause) {
			
			throw Error (`Validation problem with the contents of <${this.parsedNode.name}...> at position ${this.getPosition ()}: ${cause.message}`, {cause})

		}

	}

}

module.exports = XMLValidattionState