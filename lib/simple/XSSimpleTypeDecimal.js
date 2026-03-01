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

		return value.length === 0 ? 'No decimal value can be empty' : null

	}

	testFormat (value) {

		let period = -1, total = 0, fraction = 0

		for (let i = 0; i < value.length; i ++) {

			const c = value.charCodeAt (i); switch (c) {

				case CH_PLUS:
				case CH_MINUS:
					if (i !== 0) return `'${value}' is not a valid decimal: '${value.charAt (i)}' can occur only at the beginning`
					continue

				case CH_PERIOD:
					if (period !== -1) return `'${value}' is not a valid decimal: 2nd period occured at position ${i}`
					period = i
					continue

				default:
					if (c < CH_0 || c > CH_9) return `'${value}' is not a valid decimal: '${value.charAt (i)}' occured at position ${i}`
					total ++
					if (period !== -1) fraction ++

			}

		}
		
		if (total === 0) return `'${value}' is not a valid decimal: is has no digits at all`

		const {totalDigits, fractionDigits} = this

		if (total > totalDigits) return `'${value}' has ${total} digits, only ${totalDigits} allowed`

		if (fraction > fractionDigits) return `'${value}' has ${fraction} digits after period, only ${fractionDigits} allowed`

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