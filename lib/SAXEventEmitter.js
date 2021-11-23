const XMLReader  = require ('./XMLReader.js')

const SAXEventEmitter = class extends XMLReader {

	constructor (options = {}) {

		super (options)
		
		this.on ('data', e => this.emit (e.type, e))

	}

}

module.exports = SAXEventEmitter