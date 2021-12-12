const assert      = require ('assert')
const {Transform} = require ('stream')
const SAXEvent    = require ('./SAXEvent.js')
const XMLNode     = require ('./XMLNode.js')
const XMLLexer    = require ('./XMLLexer.js')

const OPT_ONCE = Symbol ('_once')
const OPT_SRC  = Symbol ('_src')
const OPT_SAX  = Symbol ('_sax')

const XMLReader = class extends Transform {

	constructor (options = {}) {

		options.decodeStrings = false
		options.objectMode = true
		
		if (!('stripSpace' in options)) options.stripSpace = false
		assert (options.stripSpace === true || options.stripSpace === false, 'options.stripSpace must be boolean, not ' + typeof options.stripSpace)

		if (!('useEntities' in options)) options.useEntities = true
		assert (options.useEntities === true || options.useEntities === false, 'options.useEntities must be boolean, not ' + typeof options.useEntities)

		if (!('useNamespaces' in options)) options.useNamespaces = true
		assert (options.useNamespaces === true || options.useNamespaces === false, 'options.useNamespaces must be boolean, not ' + typeof options.useNamespaces)

		const {collect} = options; delete options.collect
		assert (collect == null || typeof collect === 'function', 'options.collect must be a function, not ' + typeof collect)

		const {filter} = options; delete options.filter
		assert (filter == null || typeof filter === 'function', 'options.filter must be a function, not ' + typeof filter)

		const {map} = options; delete options.map
		assert (map == null || typeof map === 'function', 'options.map must be a function, not ' + typeof map)

		const {find} = options; delete options.find
		assert (filter == null || find == null, 'filter & find options cannot be set together')
		assert (find == null || typeof find === 'function', 'options.find must be a function, not ' + typeof find)

		super (options)

		this.stripSpace    = options.stripSpace
		this.useEntities   = options.useEntities
		this.useNamespaces = options.useNamespaces
		this.collect       = collect || null
		this.filter        = filter || find || null
		this.map           = map || null
		this [OPT_ONCE]    = find != null

		if (this.useEntities) this.entityResolver = new (require ('./EntityResolver.js')) ()
		
		this.text = ''
		this.element = null
		this.position = 0n
		
		this [OPT_SRC] = null; this.on ('pipe', src => this [OPT_SRC] = src)
		
		this [OPT_SAX] = null

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

		this.publish ({type: SAXEvent.TYPES.END_DOCUMENT})

		callback ()

	}

	get isSAX () {

		const v = this [OPT_SAX]; if (v !== null) return v

		for (const type of Object.values (SAXEvent.TYPES)) if (this.listenerCount (type) !== 0) return this [OPT_SAX] = true

		return this [OPT_SAX] = false

	}
	
	publish (xmlNode, type = null) {

		if (type !== null) xmlNode.type = type

		const {filter} = this; if (filter !== null && !filter (xmlNode)) return

		const {map} = this, value = map === null ? xmlNode : map (xmlNode)
				
		if (this.isSAX) {

			this.emit (xmlNode.type, value)

		}
		else {

			this.push (value)

		}		

		if (this [OPT_ONCE]) {

			const src = this [OPT_SRC]; if (src !== null) src.unpipe (this)

		}

	}
	
	flush_text () {
		
		let {text} = this; if (text.length === 0) return
		
		if (this.stripSpace) text = text.trim ()
		
		if (text.length !== 0) {
		
			let e = new XMLNode (text, this, SAXEvent.TYPES.CHARACTERS)
			
			e.parent = this.element
			
			this.publish (e)
		
		}
		
		this.text = ''

	}
	
	get fixText () {
	
		if (!this.useEntities) return s => s
		
		const {entityResolver} = this

		return s => entityResolver.fix (s)

	}

	_transform (chunk, encoding, callback) {

		const {length} = chunk; if (length !== 0) {

			let e = new XMLNode (chunk, this), {type} = e, {element} = this

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

					if (element === null) throw new Error (`Unbalanced end element tag "${chunk}" occured at position ${this.position}`)

					e = element

					e.type = type

					this.element = element.parent

					break

				default:

					e.parent = element

			}

			const isStart = type === SAXEvent.TYPES.START_ELEMENT

			if (isStart && this.useNamespaces) e.readNamespaces ()

			this.publish (e)
			
			if (isStart) {
				
				if (e.isSelfEnclosed) {

					this.publish (e, SAXEvent.TYPES.END_ELEMENT)

				}
				else {
				
					if (
					
						(this.element !== null && this.element.children !== null)
					
						||
						
						(this.collect !== null && this.collect (e))
					
					) e.children = []

					this.element = e

				}

			}

			this.position += BigInt (length)

		}		

		callback ()

	}

}

module.exports = XMLReader