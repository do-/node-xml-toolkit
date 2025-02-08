const assert      = require ('assert')
const {Transform} = require ('stream')
const SAXEvent    = require ('./SAXEvent.js')
const XMLNode     = require ('./XMLNode.js')
const XMLLexer    = require ('./XMLLexer.js')

const OPT_SRC  = Symbol ('_src')
const OPT_SAX  = Symbol ('_sax')

const NO_CHILDREN = []; NO_CHILDREN.push = () => {}

const XMLReader = class extends Transform {

	constructor (options = {}) {

		options.decodeStrings = false
		options.objectMode = true
		
		if (!('stripSpace' in options)) options.stripSpace = ('filterElements' in options)
		assert (options.stripSpace === true || options.stripSpace === false, 'options.stripSpace must be boolean, not ' + typeof options.stripSpace)

		if (!('useEntities' in options)) options.useEntities = true
		assert (options.useEntities === true || options.useEntities === false, 'options.useEntities must be boolean, not ' + typeof options.useEntities)

		if (!('useNamespaces' in options)) options.useNamespaces = true
		assert (options.useNamespaces === true || options.useNamespaces === false, 'options.useNamespaces must be boolean, not ' + typeof options.useNamespaces)

		let {filterElements} = options; delete options.filterElements; if (filterElements != null) {		
			
			assert (!('filter' in options), 'filter and filterElements options cannot be set simultaneously')
			
			switch (typeof filterElements) {
			
				case 'string':
					const localName = filterElements
					filterElements = e => e.localName === localName
					
				case 'function':
					options.filter = e => e.type === SAXEvent.TYPES.END_ELEMENT && filterElements (e)
					break
					
				default: 
					assert.fail ('options.filterElements must be a string or function')

			}
		
		}

		const {filter} = options; delete options.filter
		assert (filter == null || typeof filter === 'function', 'options.filter must be a function, not ' + typeof filter)

		const {map} = options; delete options.map
		assert (map == null || typeof map === 'function', 'options.map must be a function, not ' + typeof map)

		super (options)

		this.stripSpace    = options.stripSpace
		this.useEntities   = options.useEntities
		this.useNamespaces = options.useNamespaces
		this.filter        = filter || null
		this.map           = map || null

		if (this.useEntities) this.entityResolver = new (require ('./EntityResolver.js')) ()
		
		this.text = ''
		this.element = null
		this.position = 0n
		
		this [OPT_SRC] = null; this.on ('pipe', src => this [OPT_SRC] = src)
		
		this [OPT_SAX] = null

	}
	
	async findFirst () {
	
		assert (!this.isSAX, 'SAX event subscriber detected, findFirst () cannot be used')

		return new Promise ((ok, fail) => {
		
			this.once ('error', fail)
			
			const THE_END = 'finish',  nope = () => ok (null)

			this.on (THE_END, nope)
			
			this.on ('data', e => {
			
				this.off (THE_END, nope)
				
				this [OPT_SRC].unpipe (this)
				
				ok (e)
				
				this.destroy ()
			
			})
		
		})
	
	}

	process (src, lexerOptions = {}) {

		const lex = new XMLLexer (lexerOptions)
		
		lex.once ('error', x => this.destroy (x))
		
		lex.pipe (this)
		
		if (Buffer.isBuffer (src) || typeof src === 'string') lex.end (src); else src.pipe (lex)

		return this

	}

	_flush (callback) {
	
		this.flush_text ()

		this.publish (new XMLNode ('', this.entityResolver), SAXEvent.TYPES.END_DOCUMENT)

		callback ()

	}

	get isSAX () {

		const v = this [OPT_SAX]; if (v !== null) return v

		for (const type of Object.values (SAXEvent.TYPES)) if (this.listenerCount (type) !== 0) return this [OPT_SAX] = true

		return this [OPT_SAX] = false

	}
	
	publish (xmlNode, type = null) {

		if (type !== null) xmlNode.type = type

		const {filter} = this; if (filter !== null) {

			if (!filter (xmlNode)) return

			let node = xmlNode; while (true) {

				node = node.parent; if (!node) break

				if (node.children === NO_CHILDREN || node.toBePublished) continue

				const end = new XMLNode ('</' + node.src.slice (1), this.entityResolver)

				if (filter (end)) {

					node.toBePublished = true

				}
				else {

					node.children = NO_CHILDREN

				}

			}

		}

		const {map} = this, value = map === null ? xmlNode : map (xmlNode)
				
		if (this.isSAX) {

			this.emit (xmlNode.type, value)

		}
		else {

			this.push (value)

		}		

	}
	
	flush_text () {
		
		let {text} = this; if (text.length === 0) return
		
		if (this.stripSpace) text = text.trim ()
		
		if (text.length !== 0) {
		
			let e = new XMLNode (text, null, SAXEvent.TYPES.CHARACTERS)
			
			e.parent = this.element
			
			this.publish (e)
		
		}
		
		this.text = ''

	}

	_transform (chunk, encoding, callback) {

		const {length} = chunk; if (length !== 0) {

			let e = new XMLNode (chunk, this.entityResolver), {type} = e, {element} = this

			switch (type) {

				case SAXEvent.TYPES.CHARACTERS:
				case SAXEvent.TYPES.CDATA:

					this.text += e.text
					return callback ()

				default:

					this.flush_text ()

			}

			switch (type) {
							
				case SAXEvent.TYPES.END_ELEMENT:

					if (element === null) return callback (new Error (`Unbalanced end element tag "${chunk}" occured at position ${this.position}`))

					e = element

					e.type = type

					this.element = element.parent

					break

				default:

					e.parent = element

			}

			const isStart = type === SAXEvent.TYPES.START_ELEMENT

			if (isStart && this.useNamespaces) e.readNamespaces ()

			this.publish (isStart ? e.cloneStart () : e)
			
			if (isStart) {
				
				if (e.isSelfEnclosed) {

					this.publish (e, SAXEvent.TYPES.END_ELEMENT)

				}
				else {			

					this.element = e

				}

			}

			this.position += BigInt (length)

		}		

		callback ()

	}

}

module.exports = XMLReader