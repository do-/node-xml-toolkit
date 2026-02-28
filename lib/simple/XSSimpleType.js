const NamespacePrefixesMap = require ('../NamespacePrefixesMap.js')

class XSSimpleType {

	#patterns = []
	#values = []

	constructor (xs) {

		this.xs = xs
		this.length = null
		this.maxLength = Infinity
		this.minLength = 0

	}

	set totalDigits (v) {

		throw Error ('totalDigits are not supported for this type')

	}

	get totalDigits () {

		return undefined

	}

	set fractionDigits (v) {

		throw Error ('fractionDigits are not supported for this type')

	}

	toOrdered (value) {

		throw Error ('the ordering is not supported for this type')

	}

	get fractionDigits () {

		return undefined

	}

	get patterns () {

		return this.#patterns

	}

	get values () {

		return this.#values

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

		for (const s of this.strings (value)) {

			const result = this.test (s); if (result === null) return s

		}

		this.blame (value)	

	}

	* strings (value) {

		yield String (value)

	}

	test (s) {

		if (this.isEnumeration) return this.testEnumeration (s)
		
		return this.testLength (s) ?? this.testFormat (s) ?? this.testBounds (s) ?? this.testPatterns (s) ?? (super.test ? super.test (s) : null)

	}	

	testFormat (s) {

		return null

	}

	get units () {

		return 'chars'

	}

	getLength (value) {

		return value.length

	}

	testBounds (value) {

		let ordered = undefined

		if (this.minInclusive != null && (ordered   = this.toOrdered (value)) <  this.minInclusive) throw Error (`The value '${value}' is less than allowed '${this.minInclusive}'`)

		if (this.maxInclusive != null && (ordered ??= this.toOrdered (value)) >  this.maxInclusive) throw Error (`The value '${value}' is greater than allowed '${this.maxInclusive}'`)
			
		if (this.minExclusive != null && (ordered ??= this.toOrdered (value)) <= this.minExclusive) throw Error (`The value '${value}' is less or equal than the threshold '${this.minExclusive}'`)

		if (this.maxExclusive != null && (ordered ??= this.toOrdered (value)) >= this.maxExclusive) throw Error (`The value '${value}' is greater or equal than the threshold '${this.maxExclusive}'`)

	}

	testLength (value) {

		const l = this.getLength (value), {length} = this

		if (length === null) {

			if (l > this.maxLength) return `The value '${value}' is ${l} ${this.units} long, which exceeds the allowed maximum of ${this.maxLength}`

			if (l < this.minLength) return `The value '${value}' is ${l} ${this.units} long, which is less than the allowed minimum of ${this.minLength}`

		}
		else {

			if (l !== length) return `The value '${value}' is ${l} ${this.units} long, must be exaclty ${length}`

		}

		return null

	}

	get isEnumeration () {

		return this.values.length !== 0

	}

	testEnumeration (s) {

		const {values} = this; if (values.includes (s)) return null

		return `The value '${s}' is not in list: ${JSON.stringify (values)}`

	}

	testPatterns (s) {

		const {patterns} = this, {length} = patterns; if (length === 0) return null

		for (const pattern of patterns) if (pattern.test (s)) return null

		if (length === 1) return `The value '${s}' doesn't match the pattern '${patterns [0]}'`

		return `The value '${s}' doesn't match any of the patterns: ${patterns.map (_ => '' + _).join (', ')}`

	}

	validateScalar (s) {

		const result = this.test (s ?? '')

		if (result) throw Error (result)			

	}

	restrict (entries) {

		return class extends this.constructor {

			#patterns = []
			#values = []

			get patterns () {
				return this.#patterns
			}

			get values () {
				return this.#values
			}

			constructor (xs) {

				super (xs)

				for (const entry of entries) {

					const {localName, attributes} = entry

					try {

						const {value} = attributes; switch (localName) {

							case 'enumeration':
								this.#values.push (value)
								break

							case 'pattern':
								this.#patterns.push (new RegExp (value))
								break

							case 'totalDigits':
								this.totalDigits = value
								break

							case 'fractionDigits':
								this.fractionDigits = value
								break

							case 'length':
								this.length = parseInt (value)
								break

							case 'maxLength':
								this.maxLength = Math.min (this.maxLength, parseInt (value))
								break

							case 'minLength':
								this.minLength = Math.max (this.minLength, parseInt (value))
								break

							case 'maxInclusive':
								this.maxInclusive = this.toOrdered (value)
								break

							case 'maxExclusive':
								this.maxExclusive = this.toOrdered (value)
								break

							case 'minInclusive':
								this.minInclusive = this.toOrdered (value)
								break

							case 'minExclusive':
								this.minExclusive = this.toOrdered (value)
								break

						}				

					}
					catch (cause) {

						throw cause

					}
					
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
	XSSimpleType,
	XSSimpleTypeFloat,
	XSSimpleTypeBoolean,
	XSSimpleTypeDate,
	XSSimpleTypeDateTime,
	XSSimpleTypeQName,
}