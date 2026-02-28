class Frame {

	constructor (validator, parsedNode) {

		this.validator = validator
		
		try {

			const {xs} = validator

			const elementDefinifion = this.validator.getElementDefinifion (parsedNode); if (elementDefinifion === null) return

			const typeDefinition = xs.getTypeDefinition (elementDefinifion)

			this.anyType = xs.getAnyType (typeDefinition)

			this.anyType.validateAttributes (parsedNode.attributes)

		}
		catch (cause) {

			throw Error (`Validation problem at position ${this.validator.getPosition ()}: ${cause.message}, the source was: ${parsedNode.src}`, {cause})

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

			throw Error (`Validation problem at position ${this.validator.getPosition ()}: ${cause.message}`, {cause})

		}

	}

}

class XMLValidatior {

	constructor (xs, rootNode, getPosition) {

		this.xs = xs
		this.getPosition = getPosition

		this.stack = []

		this.startElement (rootNode)

	}

	get lastFrame () {

		return this.stack.at (-1) 

	}

	startElement (parsedNode) {

		this.stack.push (new Frame (this, parsedNode))
		this.textLength = 0

	}

	characters (text) {

		this.lastFrame.checkText (text)
		this.textLength += text.length

	}

	endElement () {

		const lastFrame = this.stack.pop ()
		if (this.textLength === 0) lastFrame.checkText ('')

	}

	getElementDefinifion (parsedNode) {

		const {namespaceURI, localName} = parsedNode, {xs, lastFrame} = this

		return lastFrame === undefined ? xs.getSchema (namespaceURI).getElement (localName) : lastFrame.getChildElement (parsedNode)

	}

}

module.exports = XMLValidatior