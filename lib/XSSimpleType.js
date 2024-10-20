const XSSimpleType = class {

	constructor () {

		this.patterns = []
		this.fractionDigits = Infinity

	}

	stringify (value) {

		if (value == null) throw Error ('Cannot stringify ' + value)

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

module.exports = XSSimpleType