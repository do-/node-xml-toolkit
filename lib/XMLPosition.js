const CH_LF = '\n'.charCodeAt (0)

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

		return this.#chunk

	}

	toString () {

		const {line, position, chunk} = this

		return `${chunk} at line ${line}, position ${position}`

	}
	
}

module.exports = XMLPosition