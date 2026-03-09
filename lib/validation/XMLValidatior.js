const XMLValidattionState = require ('./XMLValidattionState')

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

		this.stack.push (new XMLValidattionState (this, this.lastFrame, parsedNode))
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

}

module.exports = XMLValidatior