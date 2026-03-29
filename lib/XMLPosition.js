const CH_LF = '\n'.charCodeAt (0)
const CH_SPACE = ' '.charCodeAt (0)
const MAX_LEN_TOTAL = 50
const STR_ELLIPSIS  = '...'
const MAX_LEN = MAX_LEN_TOTAL - STR_ELLIPSIS.length

const XMLMessages = require ('./XMLMessages')

class XMLPosition {

	#line = 0
	#localPosition = 0
	#lastLine = 0
	#lastLocalPosition = 0
	#chunk

	scan (chunk) {

		this.#lastLine = this.#line
		this.#lastLocalPosition = this.#localPosition
		this.#chunk = chunk

		for (let i = 0; i < chunk.length; i ++) switch (chunk.charCodeAt (i)) {

			case CH_LF:
				this.#line ++
				this.#localPosition = 0
				break

			default:
				this.#localPosition ++

		}

	}

	get line () {

		return this.#lastLine + 1

	}

	get position () {

		return this.#lastLocalPosition + 1

	}

	get chunk () {

		const {length} = this.#chunk; if (length <= MAX_LEN) return this.#chunk

		return this.#chunk.substr (0, MAX_LEN) + STR_ELLIPSIS

	}

	get src () {

		const b = Buffer.from (this.chunk)

		for (let i = 0; i < b.length; i ++) if (b [i] < CH_SPACE) b [i] = CH_SPACE

		return ' `' + b + '`'

	}

	toString () {

		const {line, position, src} = this		

		return `[${line}:${position}]${src} `

	}

	format (code, args) {

		return this.toString () + XMLMessages.format (code, args)

	}
	
}

module.exports = XMLPosition