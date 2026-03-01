const XSSimpleTypeDecimal = require ('./XSSimpleTypeDecimal')

const fromTo = (minInclusive, maxInclusive) => class extends XSSimpleTypeInteger {

	constructor (xs) {

		super (xs)
		this.minInclusive = minInclusive
		this.maxInclusive = maxInclusive

	}

}

class XSSimpleTypeInteger extends XSSimpleTypeDecimal {

	get name () {
		return 'integer'
	}

	toOrdered (value) {

		return BigInt (value)

	}

	set fractionDigits (v) {

		if (v != '0') throw Error (`For an integer type, fractionDigits must be 0, not ${v}`)

	}

	get fractionDigits () {

		return 0

	}

	isValidNumber (num) {

		return Number.isInteger (num)

	}

}

module.exports = {

	XSSimpleTypeInteger,

	byName: {

		integer            : XSSimpleTypeInteger,

		negativeInteger    : fromTo             (undefined, 1n),
		nonPositiveInteger : fromTo             (undefined, 0n),
		nonNegativeInteger : fromTo                    (0n, undefined),
		positiveInteger    : fromTo                    (1n, undefined),

		unsignedLong       : fromTo (                   0n, 18446744073709551615n),
		unsignedInt        : fromTo (                   0n, 4294967295n),
		unsignedShort      : fromTo (                   0n, 65535n),
		unsignedByte       : fromTo (                   0n, 255n),

		long               : fromTo (-9223372036854775808n, 9223372036854775807n),
		int                : fromTo          (-2147483648n, 2147483647n),
		short              : fromTo               (-32768n, 32767n),
		byte               : fromTo                 (-128n, 127n),

	}

}