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

		const strings = [...this.strings (value)]

console.log ({strings})

		for (const s of strings) {


			if (!this.test (s)) {
				continue
			}

			return s

/*
			if (this.test (s)) {

				return s

			}
			else {

				console.log ('rejected: ' + s)
continue
			}
*/
		}
			

		this.blame (value)

	}

	* strings (value) {

		yield String (value)

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

class XSSimpleTypeBoolean extends XSSimpleType {

	* strings (value) {

		if (value) {
			yield 'true'
			yield '1'
		}
		else {
			yield 'false'
			yield '0'
		}

	}

}

/*
class XSSimpleTypeDate extends XSSimpleType {

	adjust (value) {

		return value.substring (0, 10)

	}

	stringify (value) {

		if (value instanceof Date) value = value.toJSON ()

		value = this.adjust (super.stringify (value))

	}

}
*/
module.exports = {
	XSSimpleType,
	XSSimpleTypeFloat,
	XSSimpleTypeBoolean,
}