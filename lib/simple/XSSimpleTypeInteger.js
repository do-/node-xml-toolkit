const XSSimpleTypeDecimal = require ('./XSSimpleTypeDecimal')

class XSSimpleTypeInteger extends XSSimpleTypeDecimal {

	constructor (xs) {

		super (xs)

	}

	set fractionDigits (v) {

		if (v != '0') throw Error ('For an integer type, fractionDigits must be 0')

	}

	get fractionDigits () {

		return 0

	}

	isValidNumber (num) {

		return Number.isInteger (num)

	}

}

module.exports = XSSimpleTypeInteger