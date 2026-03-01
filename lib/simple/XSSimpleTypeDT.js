const {XSSimpleType} = require ('./XSSimpleType.js')

class XSSimpleTypeDT extends XSSimpleType {

	adjust (value) {

		return typeof value === 'string' ? value : new Date (value).toJSON ()

	}

}

class XSSimpleTypeDate extends XSSimpleTypeDT {

	* strings (value) {

		value = this.adjust (value)

		const ymd = value.substring (0, 10)

		const {length} = value; if (length > 10) {

			const pos = value.indexOf ('Z')

			if (pos !== -1 && pos !== length - 1) yield ymd + value.substring (pos)

		}

		yield ymd

	}

}

class XSSimpleTypeDateTime extends XSSimpleTypeDT {

	adjust (value) {

		value = super.adjust (value)

		return value.length === 10 ? value + 'T00:00:00' : value

	}

	* strings (value) {

		value = this.adjust (value)

		yield value

		if (value.length > 19) yield value.substring (0, 19)
		
	}

}

module.exports = {
	XSSimpleTypeDate,
	XSSimpleTypeDateTime,
}