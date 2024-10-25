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

		for (const s of this.strings (value)) if (this.test (s)) return s

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

class XSSimpleTypeDT extends XSSimpleType {

	adjust (value) {

		return typeof value === 'string' ? value : new Date (value).toJSON ()

	}

}

class XSSimpleTypeDate extends XSSimpleTypeDT {

	* strings (value) {

		value = this.adjust (value)

		const ymd = value.substring (0, 10)

		yield ymd

		const pos = value.indexOf ('Z')

		if (pos === -1) return

		yield pos === 10 ? value : ymd + 'Z' + value.substring (pos)

	}

}

class XSSimpleTypeDateTime extends XSSimpleTypeDT {

	adjust (value) {

		value = super.adjust (value)

		return value.length === 10 ? value + 'T00:00:00' : value

	}

	* strings (value) {

		value = this.adjust (value)

		if (value.length > 19) yield value.substring (0, 19)

		yield value
		
	}

}

module.exports = {
	XSSimpleType,
	XSSimpleTypeFloat,
	XSSimpleTypeBoolean,
	XSSimpleTypeDate,
	XSSimpleTypeDateTime,
}