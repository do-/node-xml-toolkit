class Frame {

	constructor (validator, parsedNode) {

		this.validator = validator
		
		try {

			const {xs} = validator

			const elementDefinifion = this.validator.getElementDefinifion (parsedNode)

			const typeDefinition = xs.getTypeDefinition (elementDefinifion)

			this.complexType = xs.getComplexType (typeDefinition)

			this.complexType.validateAttributes (parsedNode.attributes)

		}
		catch (cause) {

// console.log (cause)

			throw Error (`Validation problem at position ${this.validator.getPosition ()}: ${cause.message}, the source was: ${parsedNode.src}`, {cause})

		}

	}

	getChildElement (parsedNode) {

		const {namespaceURI, localName} = parsedNode, {complexType} = this, {elements} = this.complexType, {length} = elements; if (length === 0) throw Error (`No nested elements allowed inside ${complexType.debugQName}`)

		for (let i = 0; i < elements.length; i ++) {

			const element = elements [i]; if (element.attributes.name !== localName || element.targetNamespace !== namespaceURI) continue

			return element

		}

		throw Error (`Unexpected element`)

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

	}

	endElement () {

		this.stack.pop ()

	}

	getElementDefinifion (parsedNode) {

		const {namespaceURI, localName} = parsedNode, {xs, lastFrame} = this

		return lastFrame === undefined ? xs.getSchema (namespaceURI).getElement (localName) : lastFrame.getChildElement (parsedNode)

	}

}

module.exports = XMLValidatior