const XMLPrinter = class extends (require ('./Base.js')) {

	get destroy () {

		return err => {throw err}

	}	

	reset () {

		this.text = ''

		return super.reset ()

	}

	get lastCharCode () {

		const {text} = this

		return text.charCodeAt (text.length - 1)

	}

	get isVirgin () {

		return this.text.length === 0

	}

	write (s) {

		this.text += s

	}

}

module.exports = XMLPrinter