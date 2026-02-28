const {XSSimpleType} = require ('./XSSimpleType.js')

class XSSimpleTypeFloat extends XSSimpleType {

	stringify (value) {

		if (isNaN (value)) this.blame (value)

		return (
			value ===  Infinity ?  'INF' : 
			value === -Infinity ? '-INF' : 
			super.stringify (value)
		)

	}

	toOrdered (value) {

		return parseFloat (value)

	}

	testLength (value) {

		return value.length === 0 ? 'No float value can be empty' : null

	}

	testFormat (value) {

		if (Number.isNaN (parseFloat (value))) return `'${value}' is not a number`

		return null

	}

}

module.exports = XSSimpleTypeFloat