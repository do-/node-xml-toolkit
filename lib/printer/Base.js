const os = require ('os')
const stringEscape = require ('string-escape-map')
const SAXEvent     = require ('../SAXEvent.js')

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

module.exports = class {

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

		this.decl = o.decl

		this.reset ()

	}

	reset () {

		this.stack = []
		this.isOpening = false

		const {decl} = this; if (decl) this.writeXMLDecl (decl)

		return this

	}

	newLine (delta = 0) {

		this.write (`${this.EOL}${this.space.repeat (this.level + this.stack.length + delta)}`)

	}

	openElement (name) {

		if (this.stack.length !== 0) {
			if (this.attrSpace && this.lastCharCode === CH_QQ) this.newLine (-1)
			if (this.isOpening) this.write (`>`)
		}

		if (this.space && !this.isVirgin) this.newLine ()

		this.write (`<${name}`)
		this.stack.push (name)

		this.isOpening = true

		return this

	}

	writeAttribute (name, value) {

		if (!this.isOpening) throw Error ('No attribute allowed at this point')

		if (typeof name !== 'string') throw Error ('The attribute name must be a string, not ' + (typeof name))

		if (typeof value !== 'string') throw Error ('The attribute value must be a string, not ' + (typeof value))

		if (this.attrSpace) {

			this.newLine (-1)

			this.write (this.attrSpace)

		}
		else {

			this.write (' ')

		}

		this.write (`${name}="${this.ESC_ATTR.escape (value)}"`)

		return this

	}

	writeCharacters (value) {

		if (typeof value !== 'string') throw Error ('The text content must be a string, not ' + (typeof value))

		return this.writeBody (this.ESC_BODY.escape (value))

	}

	writeBody (value) {

		if (this.stack.length === 0) throw Error ('No element started yet')

		if (value.length === 0) return this

		if (this.isOpening) {
			if (this.attrSpace && this.lastCharCode === CH_QQ) this.newLine (-1)
			this.write (`>`)
			this.isOpening = false
		}

		this.write (value)

		return this

	}

	closeElement () {

		const name = this.stack.pop ()

		if (this.isOpening) {
			if (this.attrSpace && this.lastCharCode === CH_QQ) this.newLine ()
			this.write (` />`)
			this.isOpening = false
		}
		else {
			if (this.space && this.lastCharCode === CH_GT) this.newLine ()
			this.write (`</${name}>`)
		}

		return this

	}

	writeNode (node) {

		if (node.type !== SAXEvent.TYPES.END_ELEMENT) return this.writeCharacters (node.src)

		this.openElement (node.name)

		const {namespacesMap} = node; if (namespacesMap != null && namespacesMap.default) this.writeAttribute ('xmlns', namespacesMap.default)

		if (this.stack.length === 1) {

			if (namespacesMap != null) {

				let min = Infinity; for (const name of namespacesMap.keys ()) {

					const {length} = name

					if (min > length) min = length

				}

				min += 2

				const prefixes = new Set ()

				const checkName = name => {

					if (name.length < min) return

					const pos = name.indexOf (':'); if (pos === -1) return

					const prefix = name.substring (0, pos); if (!namespacesMap.has (prefix)) return

					prefixes.add (prefix)

				}

				const checkNames = n => {

					checkName (n.name)

					for (const [name, value] of n.attributes.entries ()) {
						checkName (name)
						checkName (value)
					}

					for (const child of n.children) if (child.type === SAXEvent.TYPES.END_ELEMENT) checkNames (child); else checkName (child.src)

				}

				checkNames (node)

				for (const prefix of prefixes.values ())

					this.writeAttribute ('xmlns:' + prefix, namespacesMap.get (prefix))

			}						

		}

		for (const [name, value] of node.attributes.entries ()) this.writeAttribute (name, value)

		for (const child of node.children) this.writeNode (child)
		
		this.closeElement ()

		return this

	}

	writeXMLDecl ({encoding, standalone} = {}) {

		if (this.stack.length !== 0) throw Error ('The document is already started')

		this.write ('<?xml version="1.0"')

		if (encoding != null) this.write (` encoding="${encoding}"`)
		
		if (standalone != null) this.write (` standalone="${standalone ? 'yes' : 'no'}"`)

		this.write ('?>')

		return this

	}

}