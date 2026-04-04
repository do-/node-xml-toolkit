const {XSSimpleType} = require ('./XSSimpleType.js')

const CH_PLUS   = '+'.charCodeAt (0)
const CH_MINUS  = '-'.charCodeAt (0)
const CH_PERIOD = '.'.charCodeAt (0)
const CH_0      = '0'.charCodeAt (0)
const CH_9      = '9'.charCodeAt (0)

class XSSimpleTypeDecimal extends XSSimpleType {

	#fractionDigits = undefined
	#totalDigits = undefined

	get name () {
		return 'decimal'
	}

	isValidNumber (num) {

		return !Number.isNaN (num)

	}

	toOrdered (value) {

		return parseFloat (value)

	}

	set totalDigits (v) {

		this.#totalDigits = parseInt (v)

	}

	get totalDigits () {

		return this.#totalDigits ?? super.totalDigits ?? Infinity

	}	
	
	set fractionDigits (v) {

		this.#fractionDigits = parseInt (v)

	}

	get fractionDigits () {

		return this.#fractionDigits ?? super.fractionDigits ?? Infinity

	}

	testLength (value) {

		return value.length === 0 ? ['XVS-00013'] : null

	}

	testFormat (value) {

		let period = -1, total = 0, fraction = 0

		for (let i = 0; i < value.length; i ++) {

			const c = value.charCodeAt (i); switch (c) {

				case CH_PLUS:
				case CH_MINUS:
					if (i !== 0) return ['XVS-00014', value, value.charAt (i)]
					continue

				case CH_PERIOD:
					if (period !== -1) return ['XVS-00015', value, i]
					period = i
					continue

				default:
					if (c < CH_0 || c > CH_9) return ['XVS-00016', value, value.charAt (i), i]
					total ++
					if (period !== -1) fraction ++

			}

		}
		
		if (total === 0) return ['XVS-00017', value]

		{

			const {totalDigits} = this; if (total > totalDigits) return ['XVS-00018', value, total, totalDigits]

		}

		{

			const {fractionDigits} = this; if (fraction > fractionDigits) return ['XVS-00019', value, fraction, fractionDigits]

		}

		return null

	}

	stringify (value) {

		let num = value

		const {fractionDigits} = this

		const t = typeof value; switch (t) {

			case 'bigint':
				return fractionDigits === 0 || fractionDigits === Infinity ? 
					String (value) : 
					`${value}.${'0'.repeat (fractionDigits)}`

			case 'string':
				num = parseFloat (value)	

			case 'number':
				if (!this.isValidNumber (num)) this.blame (value, 'cannot be read as number')
				return fractionDigits === Infinity ? 
					num.toString () : 
					num.toFixed (this.fractionDigits)

			default: 
				this.blame (value, `no idea how to treat ${t} as decimal`)

		}

	}

}

module.exports = XSSimpleTypeDecimal