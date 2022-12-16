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

		this.code = 'code' in o ? o.code: 'Server'

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