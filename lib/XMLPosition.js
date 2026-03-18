const CH_LF = '\n'.charCodeAt (0)

class XMLPosition {

	#line = 0
	#localPosition = 0
	#lastLine = 0
	#lastLocalPosition = 0

	scan (chunk) {

		this.#lastLine = this.#line
		this.#lastLocalPosition = this.#localPosition

		for (let i = 0; i < chunk.length; i ++) switch (chunk.charCodeAt (i)) {

			case CH_LF:
				this.#line ++
				this.#localPosition = 0
				break

			default:
				this.#localPosition ++

		}

	}

	toJSON () {

    	return [this.#lastLine + 1, this.#lastLocalPosition + 1]

	}	
	
}

module.exports = XMLPosition