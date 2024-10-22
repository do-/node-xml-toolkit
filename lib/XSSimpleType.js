class XSSimpleType {

	constructor () {

		this.patterns = []
		this.fractionDigits = Infinity

	}

	blame (value) {

		throw Error ('Cannot stringify ' + value)

	}

	stringify (value) {

		if (value == null) this.blame (value)

		return String (value)

	}

	test (s) {

		for (const pattern of this.patterns) if (!pattern.test (s)) return false

		return true

	}

	restrict (entries) {

		return class extends this.constructor {

			constructor () {

				super ()

				for (const {name, value} of entries) switch (name) {

					case 'pattern':
						this.patterns.push (new RegExp (value))
						break

					case 'fractionDigits':
						this.fractionDigits = parseInt (value)
						break

				}

			}

		}

	}

}

class XSSimpleTypeFloat extends XSSimpleType {

	stringify (value) {

		return (
			value ===  Infinity ?  'INF' : 
			value === -Infinity ? '-INF' : 
			super.stringify (value)
		)

	}

}

module.exports = {
	XSSimpleType,
	XSSimpleTypeFloat,
}