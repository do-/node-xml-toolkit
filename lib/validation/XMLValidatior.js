const XMLValidationState = require ('./XMLValidationState')

class XMLValidatior {

	#state = null

	constructor (xs, rootNode, position) {

		this.xs = xs
		this.position = position

		this.startElement (rootNode)

	}

	startElement (parsedNode) {

		if (this.#state === null) return this.#state = new XMLValidationState (this, parsedNode, this.xs.getSchema (parsedNode.namespaceURI).getElement (parsedNode.localName))

		this.#state.startElement (parsedNode)

	}

	characters (text) {

		this.#state.characters (text)

	}

	endElement (parsedNode) {

		this.#state.endElement (parsedNode)

	}

}

module.exports = XMLValidatior