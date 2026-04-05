const {XSSimpleType} = require ('./XSSimpleType.js')
const DT7 = require ('./DT7.js')

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

	testFormat (s) {

		try {

			const dt7 = new DT7 (s)

			if (dt7.hour !== undefined) return ['XVS-00022', s]
			
		}
		catch (err) {

			if ('payload' in err) return err.payload

			throw err

		}

	}

}

class XSSimpleTypeDateTime extends XSSimpleTypeDT {

	adjust (value) {

		value = super.adjust (value)

		return value.length === 10 ? value + 'T00:00:00' : value

	}

	testFormat (s) {

		try {

			const dt7 = new DT7 (s)

			if (dt7.hour === undefined) return ['XVS-00023', s]
			
		}
		catch (err) {

			if ('payload' in err) return err.payload

			throw err

		}

	}

	* strings (value) {

		value = this.adjust (value)

		yield value

		if (value.length > 19) yield value.substring (0, 19)
		
	}

}

class XSSimpleTypeDateTimeStamp extends XSSimpleTypeDateTime {

	testFormat (s) {

		try {

			const dt7 = new DT7 (s)

			if (dt7.hour === undefined || dt7.tz === undefined) return ['XVS-00024', s]

		}
		catch (err) {

			if ('payload' in err) return err.payload

			throw err

		}

	}

}

module.exports = {
	XSSimpleTypeDate,
	XSSimpleTypeDateTime,
	XSSimpleTypeDateTimeStamp,
	byName: {
		date          : XSSimpleTypeDate,
		dateTime      : XSSimpleTypeDateTime,
		dateTimeStamp : XSSimpleTypeDateTimeStamp,
	}

}