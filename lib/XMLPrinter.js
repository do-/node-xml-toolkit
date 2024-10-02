const os = require ('os')
const stringEscape = require ('string-escape-map')
const SAXEvent     = require ('./SAXEvent.js')

const CH_QQ = '"'.charCodeAt (0)
const CH_GT = '>'.charCodeAt (0)

const ESC = [

	[ '"', '&quot;'],
	[ '<', '&lt;'],
	[ '>', '&gt;'],
	[ '&', '&amp;'],

	['\n', '&#xA;'],
	['\r', '&#xD;'],

]

const isSafeNonNegative = value => Number.isSafeInteger (value) && value >= 0

const XMLPrinter = class {

	constructor (o = {}) {

		this.level = o.level ?? 0
		
		if (!isSafeNonNegative (this.level)) throw Error ('Invalid level: ' + o.level)

		const setSpaceOption = name => {

			const value = o [name] || 0

			this [name] = (() => {

				switch (typeof value) {

					case 'string': return value

					case 'number': if (isSafeNonNegative (value)) return ' '.repeat (value)

					default: throw Error (`Invalid ${name}: ${value}`)
				
				}

			}) ()

		}

		setSpaceOption ('space')

		if (this.space) {

			setSpaceOption ('attrSpace')

			this.EOL = o.EOL ?? os.EOL

			if (typeof this.EOL !== 'string') throw Error ('Invalid EOL: ' + o.EOL)

		}
		else {

			for (const name of ['attrSpace', 'EOL']) if (o [name] != null) throw Error (`Without .space, .${name} cannot be set`)

			this.EOL = ''

		}

		this.encodeLineBreaks = o.encodeLineBreaks ?? true

		{

			const to = this.encodeLineBreaks ? Infinity : -2

			this.ESC_BODY = new stringEscape (ESC.slice (1, to))
			this.ESC_ATTR = new stringEscape (ESC.slice (0, to))

		}

		this.reset ()

	}

	reset () {

		this.text = ''
		this.stack = []
		this.isOpening = false

	}

	newLine (delta = 0) {

		return this.EOL + this.space.repeat (this.level + this.stack.length + delta)

	}

	append (s) {

		this.text += s

		this.lastCharCode = s.charCodeAt (s.length - 1)

	}

	openElement (name) {

		if (this.stack.length !== 0) {
			if (this.attrSpace && this.lastCharCode === CH_QQ) this.append (this.newLine (-1))
			if (this.isOpening) this.append (`>`)
			if (this.space)     this.append (this.newLine ())
		}

		this.append (`<${name}`)
		this.stack.push (name)

		this.isOpening = true

	}

	writeAttribute (name, value) {

		if (!this.isOpening) throw Error ('No attribute allowed at this point')

		if (typeof name !== 'string') throw Error ('The attribute name must be a string, not ' + (typeof name))

		if (typeof value !== 'string') throw Error ('The attribute value must be a string, not ' + (typeof value))

		this.append (`${this.attrSpace ? `${this.newLine (-1)}${this.attrSpace}` : ' '}${name}="${this.ESC_ATTR.escape (value)}"`)

	}

	writeCharacters (value) {

		if (this.stack.length === 0) throw Error ('No element started yet')

		if (typeof value !== 'string') throw Error ('The text content must be a string, not ' + (typeof value))

		if (value.length === 0) return

		if (this.isOpening) {
			if (this.attrSpace && this.lastCharCode === CH_QQ) this.append (this.newLine (-1))
			this.append (`>`)
			this.isOpening = false
		}

		this.append (this.ESC_BODY.escape (value))

	}

	closeElement () {

		const name = this.stack.pop ()

		if (this.isOpening) {
			if (this.attrSpace && this.lastCharCode === CH_QQ) this.append (this.newLine ())
			this.append (` />`)
			this.isOpening = false
		}
		else {
			if (this.space && this.lastCharCode === CH_GT) this.append (this.newLine ())
			this.append (`</${name}>`)
		}

	}

	writeNode (node) {

		if (node.type !== SAXEvent.TYPES.END_ELEMENT) return this.writeCharacters (node.src)

		this.openElement (node.name)

		for (const [name, value] of node.attributes.entries ()) this.writeAttribute (name, value)

		for (const child of node.children) this.writeNode (child)
		
		this.closeElement ()

	}

}

module.exports = XMLPrinter