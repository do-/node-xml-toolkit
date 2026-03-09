const XMLValidationState = require ('./XMLValidationState')

class XMLValidatior {

	#state = null

	constructor (xs, rootNode, getPosition) {

		this.xs = xs
		this.getPosition = getPosition

		this.startElement (rootNode)

	}

	getChildElement ({localName, namespaceURI}) {

		return this.xs.getSchema (namespaceURI).getElement (localName)

	}

	startElement (parsedNode) {

		if (this.#state === null) return this.#state = new XMLValidationState (this, parsedNode)

		this.#state.startElement (parsedNode)

	}

	characters (text) {

		this.#state.characters (text)

	}

	endElement () {

		this.#state.endElement ()

	}

}

module.exports = XMLValidatior