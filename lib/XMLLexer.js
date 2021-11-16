const assert      = require ('assert')
const {Transform} = require ('stream')

const XMLLexerBodyString = require ('./XMLLexer/XMLLexerBodyString.js')

const ST_TEXT  = 0
const ST_LT	   = 1
const ST_LT_X  = 2
const ST_TAG   = 3
const ST_TAG_X = 4

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

		this.body		= new XMLLexerBodyString ()
		this.state      = ST_TEXT
		this.start      = 0
		this.awaited	= null
		
	}
	
	isClosing (pos) {
	
		const {awaited} = this, {length} = awaited; if (length === 0) return true

		let from = pos - length; if (from < this.start) return false

		if (this.body.charCodeAt (from) !== awaited [0]) return false

		if (length === 2 && this.body.charCodeAt (from + 1) !== awaited [1]) return false
		
		return true
	
	}
	
	setState (state, awaited = null) {

		switch (state) {

			case ST_TAG:
			case ST_TAG_X:
				assert (awaited != null, 'ST_TAG[_X]: awaited is mandatory')
				break

			default:
				assert (awaited === null, 'not ST_TAG[_X]: awaited must be null')
				break

		}

		this.state      = state
		this.awaited	= awaited

	}

	parse () {	
	
		outer: while (true) {
		
			const {start, body} = this

			switch (this.state) {
			
				case ST_TEXT:
				
					{

						const pos = body.indexOfLt (start); switch (pos) {

							case -1:
								return

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

						const pos = start + 1; if (pos >= body.size ()) return null

						switch (body.charCodeAt (pos)) {

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

						const pos = start + 2; if (pos >= body.size ()) return null
						
						switch (body.charCodeAt (pos)) {
						
							case CH_MINUS:
								this.setState (ST_TAG, CL_COMMENT)
								break
								
							default:
								this.setState (ST_TAG_X, CL_DEAFULT)
								break
						
						}

					}
				
					break
					
				case ST_TAG:
				
					let pos = start; while (true) {

						pos = body.indexOfGt (pos); if (pos === -1) return
						
						if (!this.isClosing (pos)) continue

						this.publishTo (pos)

						this.setState (ST_TEXT)

						continue outer							

					}
				
				case ST_TAG_X:
				
					for (let pos = start + 1; pos < body.size (); pos ++) {
					
						switch (body.charCodeAt (pos)) {
						
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
								if (!this.isClosing (pos)) break
								this.publishTo (pos)
								this.setState (ST_TEXT)
								continue outer
							
						}

					}
					
					return

				default:
					throw new Error ('Invalid state: ' + this.state)
					
			}

		}	
		
	}

	publishTo (pos) {
	
		const lexeme = this.body.slice (this.start, ++ pos)

		this.start = pos

		if (lexeme.length !== 0) this.push (lexeme)

	}

	_flush (callback) {
	
		this.publishTo (this.body.size () - 1)

	}
	
	_transform (chunk, encoding, callback) {

console.log ({chunk})

		this.body.append (chunk)
		
		this.parse ()

		this.body.trim (this.start)
		
		this.start = 0
		
		callback ()

	}
	
}

module.exports = XMLLexer