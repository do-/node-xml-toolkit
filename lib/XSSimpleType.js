const NamespacePrefixesMap = require ('./NamespacePrefixesMap.js')

class XSSimpleType {

	constructor (xs) {

		this.xs = xs
		this.patterns = []
		this.fractionDigits = Infinity

	}

	blame (value) {

		let s; try {

			s = JSON.stringify (value)

		}
		catch (x) {

			s = String (value)

		}

		throw Error (`Cannot stringify ${typeof value} ${s}`)

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

class XSSimpleTypeQName extends XSSimpleType {

	stringify (value) {

		if (typeof value !== 'object' || !('localName' in value)) this.blame (value)

		const {xs} = this

		if (!xs.ns) xs.ns = new NamespacePrefixesMap (xs)

		return xs.ns.QName (value.localName, value.namespaceURI)

	}
			
}

class XSSimpleTypeFloat extends XSSimpleType {

	stringify (value) {

		if (isNaN (value)) this.blame (value)

		return (
			value ===  Infinity ?  'INF' : 
			value === -Infinity ? '-INF' : 
			super.stringify (value)
		)

	}

}

class XSSimpleTypeDecimal extends XSSimpleType {

	stringify (value) {

		if (isNaN (value)) this.blame (value)

		const {fractionDigits} = this, num = parseFloat (value)

		return fractionDigits === Infinity ? num.toString () : num.toFixed (this.fractionDigits)

	}

}

class XSSimpleTypeBoolean extends XSSimpleType {

	static toCanonical (value) {

		switch (typeof value) {

			case 'boolean': return value

			case 'number':
				switch (value) {
					case 0: return false
					case 1: return true
					default: return null
				}

			case 'string':

				switch (value) {

					case '0':
					case 'false':
						return false

					case '1':
					case 'true':
						return true

					default: 
						return null

				}
				
		}

	}

	* strings (value) {

		const c = XSSimpleTypeBoolean.toCanonical (value); if (c !== null) {

			if (c) {
				yield 'true'
				yield '1'
			}
			else {
				yield 'false'
				yield '0'
			}

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

		yield value

		if (value.length > 19) yield value.substring (0, 19)
		
	}

}

XSSimpleType.forName = name => {

	switch (name) {

		case 'QName'   : return XSSimpleTypeQName

		case 'boolean' : return XSSimpleTypeBoolean

		case 'date'    : return XSSimpleTypeDate

		case 'dateTime': return XSSimpleTypeDateTime

		case 'decimal' : return XSSimpleTypeDecimal

		case 'float'   :

		case 'double'  :
						 return XSSimpleTypeFloat

		default        : return XSSimpleType
	}

}

module.exports = {
	XSSimpleType,
	XSSimpleTypeFloat,
	XSSimpleTypeBoolean,
	XSSimpleTypeDate,
	XSSimpleTypeDateTime,
	XSSimpleTypeDecimal,
	XSSimpleTypeQName,
}