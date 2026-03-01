const {XSSimpleType} = require ('./XSSimpleType.js')

class XSSimpleTypeFloatingPoint extends XSSimpleType {

	stringify (value) {

		if (isNaN (value)) this.blame (value)

		return (
			value ===  Infinity ?  'INF' : 
			value === -Infinity ? '-INF' : 
			super.stringify (value)
		)

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

		if (Number.isNaN (parseFloat (value)) && value !== 'NaN') return `'${value}' is not a floating point number`

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