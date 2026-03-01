class XSSimpleType {

	constructor (xs) {

		this.xs = xs
		this.length = null
		this.maxLength = Infinity
		this.minLength = 0

	}

	get totalDigits ()     { return undefined }
	set totalDigits (v)    { throw Error ('totalDigits are not supported for this type') }

	get fractionDigits ()  { return undefined }
	set fractionDigits (_) { throw Error ('fractionDigits are not supported for this type') }

	toOrdered (_)          { throw Error ('the ordering is not supported for this type') }

	get patterns ()        { return [] }
	get values   ()        { return [] }

	get name () {
		return 'anyType'
	}

	blame (value, reasons) {

		if (!Array.isArray (reasons)) reasons = [reasons]

		let s; try {

			s = JSON.stringify (value)

		}
		catch (x) {

			s = String (value)

		}

		throw Error (`Cannot stringify ${typeof value} ${s} as ${this.name}: ${reasons.join ('; ')}`)

	}

	stringify (value) {

		if (value == null) this.blame (value, 'nullish values are unacceptable')

		const reasons = []; for (const s of this.strings (value)) {

			const result = this.test (s); if (result === null) return s
						
			reasons.push (result)

		}

		this.blame (value, reasons)

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

			get name () {
				return super.name
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
								this.maxLength = parseInt (value)
								break

							case 'minLength':
								this.minLength = parseInt (value)
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

module.exports = {
	XSSimpleType,
}