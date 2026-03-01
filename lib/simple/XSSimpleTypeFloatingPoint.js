const {XSSimpleType} = require ('./XSSimpleType.js')

class XSSimpleTypeFloatingPoint extends XSSimpleType {

	stringify (value) {

		const verbatim = value

		if (Number.isNaN (value)) return 'NaN'

		if (typeof value !== 'number') value = this.toOrdered (value)

		if (Number.isNaN (value)) this.blame (verbatim, 'Not a number, yet not NaN')

		switch (value) {
			case Number.POSITIVE_INFINITY: return 'INF'
			case Number.NEGATIVE_INFINITY: return '-INF'
			default: return String (value)
		}

	}

	get name () {
		return 'float'
	}

	toOrdered (value) {

		return parseFloat (value)

	}

	testLength (value) {

		return value.length === 0 ? 'No floating point number can be empty' : null

	}

	testFormat (value) {

		if (Number.isNaN (this.toOrdered (value)) && value !== 'NaN') return `'${value}' is not a floating point number`

		return null

	}

}

class XSSimpleTypeFloat extends XSSimpleTypeFloatingPoint {

	constructor (xs) {

		super (xs)
		this.maxInclusive = 3.4028235E+38
		this.minInclusive = -this.maxInclusive

	}

}

class XSSimpleTypeDouble extends XSSimpleTypeFloatingPoint {

	constructor (xs) {

		super (xs)
		this.maxInclusive = 1.7976931348623157E+308
		this.minInclusive = -this.maxInclusive

	}

}

module.exports = {
	XSSimpleTypeFloat,
	XSSimpleTypeDouble,
	byName: {
		'float' : XSSimpleTypeFloat,
		'double': XSSimpleTypeDouble,
	}
}