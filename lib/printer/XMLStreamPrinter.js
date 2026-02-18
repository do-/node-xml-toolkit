const {Writable} = require ('node:stream')

const XMLStreamPrinter = class extends (require ('./Base.js')) {

	#inStreams    = []
	#isVirgin     = true
	#lastCharCode = 0
	#open         = true

	constructor (o) {

		if (!o || typeof o !== 'object' || !('out' in o)) throw Error (`XMLStreamPrinter requires an .out option`)
		if (!(o.out instanceof Writable)) throw Error (`.out must be Writable, ${typeof o.out} ${o.out} found`)

		super (o)

		this.out = o.out
		this.out.on ('drain', () => this.open = true)

	}

	get end () {

		return () => this.out.end ()

	}

	get destroy () {

		return err => this.out.destroy (err)

	}	

	get inStream () {

		return this.#inStreams.at (-1)

	}

	forEach (stream, onData) {

		if (this.#inStreams.length !== 0) return this.destroy (Error ('Nested streams not yet supported'))

		if (!this.#open) stream.pause ()
		
		this.#inStreams.push (stream)

		return new Promise ((ok, fail) => {

			stream.on ('error', err => {

				this.destroy (err)

				fail (err)

			})

			stream.on ('end', () => {

				this.#inStreams.pop ()

				ok ()

			})

			stream.on ('data', data => {

				try {

					onData (data)

				}
				catch (err) {

					stream.destroy (err)

				}
							
			})

		}) 

	}

	set open (nowOpen) {

		const wasOpen = this.#open; if (wasOpen === nowOpen) return

		this.#open = nowOpen

		if (!this.inStream) return

		nowOpen ? this.inStream.resume () : this.inStream.pause ()

	}

	get lastCharCode () {

		return this.#lastCharCode

	}

	get isVirgin () {

		return this.#isVirgin

	}

	write (s) {

		const {length} = s; if (length === 0) return

		this.#lastCharCode = s.charCodeAt (length - 1)
		this.#isVirgin = false

		this.open = this.out.write (s)

	}

}

module.exports = XMLStreamPrinter