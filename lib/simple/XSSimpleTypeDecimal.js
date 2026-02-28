const {XSSimpleType} = require ('./XSSimpleType.js')

class XSSimpleTypeDecimal extends XSSimpleType {

	#fractionDigits = undefined

	isValidNumber (num) {

		return !Number.isNaN (num)

	}

	set fractionDigits (v) {

		this.#fractionDigits = parseInt (v)

	}

	get fractionDigits () {

		return this.#fractionDigits ?? super.fractionDigits ?? Infinity

	}

	stringify (value) {

		let num = value

		const {fractionDigits} = this

		switch (typeof value) {

			case 'bigint':
				return fractionDigits === 0 || fractionDigits === Infinity ? 
					String (value) : 
					`${value}.${'0'.repeat (fractionDigits)}`

			case 'string':
				num = parseFloat (value)	

			case 'number':
				if (!this.isValidNumber (num)) this.blame (value)
				return fractionDigits === Infinity ? 
					num.toString () : 
					num.toFixed (this.fractionDigits)

			default: 
				this.blame (value)

		}

	}

}

module.exports = XSSimpleTypeDecimal