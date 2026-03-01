const {XSSimpleType} = require ('./XSSimpleType.js')

class XSSimpleTypeBoolean extends XSSimpleType {

	static toCanonical (value) {

		switch (typeof value) {

			case 'boolean': return value

			case 'number':
				switch (value) {
					case 0: return false
					case 1: return true
					default: return null
				}

			case 'string':

				switch (value) {

					case '0':
					case 'false':
						return false

					case '1':
					case 'true':
						return true

					default: 
						return null

				}
				
		}

	}

	get name () {
		return 'boolean'
	}

	toOrdered (value) {

		switch (value) {
			case '0': 
			case 'false': 
				return 0
			case '1': 
			case 'true': 
				return 1
		}

		return undefined

	}

	testLength (value) {

		return value.length === 0 ? 'No boolean value can be empty' : null

	}

	testFormat (value) {

		if (this.toOrdered (value) === undefined) return `'${value}' is not a boolean value`

		return null

	}

	* strings (value) {

		const c = XSSimpleTypeBoolean.toCanonical (value); if (c !== null) {

			if (c) {
				yield 'true'
				yield '1'
			}
			else {
				yield 'false'
				yield '0'
			}

		}

	}

}

module.exports = XSSimpleTypeBoolean