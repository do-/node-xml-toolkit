const XMLSchemata = require ('./XMLSchemata.js')

const SOAPFault = class {

	constructor (message, o) {

		if (o == null && typeof message === 'object') {
			o = message
			this.message = o.message
		}
		else {
			this.message = message
		}

		if ('code' in o) this.code = o.code

		if ('actor' in o) {
			this.actor = o.actor
		}
		else if ('role' in o) {
			this.actor = o.role
		}

		if ('detail' in o) this.detail = XMLSchemata.any (o.detail)
		
		this.lang = o.lang || 'en'

	}

}

module.exports = SOAPFault