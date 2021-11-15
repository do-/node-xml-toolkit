const assert = require ('assert')
const {Transform} = require ('stream')

const ST_TEXT = 0
const ST_LT	  = 1
const ST_LT_X = 2
const ST_TAG  = 3

const CH_EXCLAMATION = '!'.charCodeAt (0)
const CH_QUESTION    = '?'.charCodeAt (0)
const CH_MINUS       = '-'.charCodeAt (0)
const CH_SQUARE      = '['.charCodeAt (0)
const CH_GT          = '>'.charCodeAt (0)

const CL_DEAFULT = Buffer.from ('')
const CL_PI      = Buffer.from ('?',  'ascii')
const CL_COMMENT = Buffer.from ('--', 'ascii')
const CL_SQ_1    = Buffer.from (']',  'ascii')
const CL_SQ_2    = Buffer.from (']]', 'ascii')

const XMLLexer = class extends Transform {

	constructor (options = {}) {

		options.readableObjectMode = true
		options.decodeStrings = false
								
		super (options)

		this.bodyString	= ''
		this.state      = ST_TEXT
		this.start      = 0
		this.awaited	= null
		
	}
	
	append (chunk) {	
		this.bodyString += chunk	
	}
	
	trim () {
		this.bodyString = this.bodyString.slice (this.start)
	}
	
	charCodeAt (pos) {
		return this.bodyString.charCodeAt (pos)	
	}

	indexOfLt () {
		return this.bodyString.indexOf ('<', this.start)	
	}
	
	sliceTo (to) {
		return this.bodyString.slice (this.start, this.start = ++ to)		
	}

	size () {
		return this.bodyString.length
	}
	
	setState (state, awaited = null) {

		switch (state) {

			case ST_TAG:
				assert (awaited != null, 'ST_TAG: awaited is mandatory')
				break

			default:
				assert (awaited === null, 'not ST_TAG: awaited must be null')
				break

		}

		this.state      = state
		this.awaited	= awaited

	}

	parse () {	
	
		outer: while (true) {

			switch (this.state) {
			
				case ST_TEXT:
				
					{

						const pos = this.indexOfLt (); switch (pos) {

							case -1:
								return null

							case  0:
								this.setState (ST_LT)
								break

							default:
								this.publishTo (pos - 1)
								this.setState (ST_LT)

						}

					}
				
					
					break
					
				case ST_LT: 
				
					{

						const pos = this.start + 1; if (pos >= this.size ()) return null

						switch (this.charCodeAt (pos)) {

							case CH_EXCLAMATION:
								this.setState (ST_LT_X)
								break

							case CH_QUESTION:
								this.setState (ST_TAG, CL_PI)
								break

							default:
								this.setState (ST_TAG, CL_DEAFULT)
								break
						}

					}
				
					
					break
					
				case ST_LT_X:
				
					{

						const pos = this.start + 2; if (pos >= this.size ()) return null

						this.setState (ST_TAG, 
							this.charCodeAt (pos) === CH_MINUS ? CL_COMMENT : CL_DEAFULT
						)
					
					}
				
					break
					
				case ST_TAG:
				
					const {start} = this

					for (let pos = start + 1; pos < this.size (); pos ++) {
					
						switch (this.charCodeAt (pos)) {
						
							case CH_SQUARE:
								
								switch (this.awaited) {
								
									case CL_DEAFULT:
										this.awaited = CL_SQ_1
										break
										
									case CL_SQ_1:
										this.awaited = CL_SQ_2
										break

								}
							
								break

							case CH_GT:
							
								const {awaited} = this, {length} = awaited
								if (length > 0) {
									let from = pos - length
									if (from < start) break
									if (this.charCodeAt (from) !== awaited [0]) break
									if (length > 1 && this.charCodeAt (from + 1) !== awaited [1]) break
								}
								this.publishTo (pos)
								this.setState (ST_TEXT)
								continue outer
							
						}

					}
					break

				default:
					throw new Error ('Invalid state: ' + this.state)
					
			}

		}	
		
	}
	
	publishTo (pos) {
	
		let s = this.sliceTo (pos)
		
		if (s.length === 0) return

		this.push (s)

	}

	_flush (callback) {
	
		this.publishTo (this.size () - 1)

	}
	
	_write (chunk, encoding, callback) {

console.log ({chunk, encoding})

		this.append (chunk)
		
		this.parse ()

		this.trim ()
		
		callback ()

	}
	
}

module.exports = XMLLexer