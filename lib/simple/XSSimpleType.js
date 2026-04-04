const XMLMessages = require ('../XMLMessages')

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
						
			reasons.push (XMLMessages.format (result))

		}

		this.blame (value, reasons)

	}

	* strings (value) {

		yield String (value)

	}

	test (s) {

		if (this.isEnumeration) return this.testEnumeration (s)
		
		return this.testLength (s) ?? this.testFormat (s) ?? this.testBounds (s) ?? this.testPatterns (s) ?? (/*super.test ? super.test (s) :*/ null)

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

		{

			const {minInclusive} = this; if (minInclusive != null && (ordered   = this.toOrdered (value)) <  minInclusive) return ['XVS-00007', value, minInclusive]
			
		}

		{

			const {maxInclusive} = this; if (maxInclusive != null && (ordered ??= this.toOrdered (value)) > maxInclusive) return ['XVS-00008', value, maxInclusive]
			
		}

		{

			const {minExclusive} = this; if (minExclusive != null && (ordered ??= this.toOrdered (value)) <= minExclusive) return ['XVS-00009', value, minExclusive]
			
		}

		{

			const {maxExclusive} = this; if (maxExclusive != null && (ordered ??= this.toOrdered (value)) >= maxExclusive) return ['XVS-00010', value, maxExclusive]
			
		}

	}

	testLength (value) {

		const l = this.getLength (value), {length, units} = this

		if (length === null) {

			{

				const {maxLength} = this; if (l > maxLength) return ['XVS-00004', value, l, maxLength]

			}

			{

				const {minLength} = this; if (l < minLength) return ['XVS-00005', value, l, minLength]

			}

		}
		else {

			if (l !== length) return ['XVS-00006', value, l, length]

		}

		return null

	}

	get isEnumeration () {

		return this.values.length !== 0

	}

	testEnumeration (s) {

		const {values} = this; if (values.includes (s)) return null

		return ['XVS-00003', JSON.stringify (values)]

	}

	testPatterns (s) {

		const {patterns} = this, {length} = patterns; if (length === 0) return null

		for (const pattern of patterns) if (pattern.test (s)) return null

		return [length === 1 ? 'XVS-00001' : 'XVS-00002', s, patterns.join (', ')]

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