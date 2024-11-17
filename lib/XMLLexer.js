const assert      = require ('assert')
const {Transform} = require ('stream')
const {StringDecoder} = require('string_decoder')

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

const CL_DEAFULT = ''
const CL_PI      = '?'
const CL_COMMENT = '--'
const CL_SQ_1    = ']'

const S_ENCODING = Symbol ('encoding')

const XMLLexer = class extends Transform {

	constructor (options = {}) {

		options.readableObjectMode = true
		options.decodeStrings = false
		
		let encoding = options.encoding; delete options.encoding
		if (encoding == null) encoding = 'utf8'
		
		let maxLength = options.maxLength; delete options.maxLength
		if (maxLength == null) maxLength = 1 << 20
		
		assert (Number.isInteger (maxLength), 'maxLength must be integer, not ' + maxLength)
		assert (maxLength > 0, 'maxLength must be positive, not ' + maxLength)
		
		super (options)
		
		this.decoder      = new StringDecoder ('utf8')

		this.body		  = ''
		this.start        = 0
		this.setState (ST_TEXT)
		this.beforeBody   = 0n
		
		this [S_ENCODING] = encoding
		this.maxLength    = maxLength

	}

	isClosing (pos) {

		const {awaited, body} = this, {length} = awaited; if (length === 0) return true

		const from = pos - length; if (from < this.start) return false

		for (let i = 0; i < length; i ++) if (body.charCodeAt (from + i) !== awaited.charCodeAt (i)) return false
		
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
				this.position = 0
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

						const pos = body.indexOf ('<', start); switch (pos) {

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

						const pos = start + 1; if (pos >= body.length) return null

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

						const pos = start + 2; if (pos >= body.length) return null

						switch (body.charCodeAt (pos)) {
						
							case CH_MINUS:
								this.setState (ST_TAG, CL_COMMENT)
								break
								
							default:
								this.setState (ST_TAG_X, CL_DEAFULT)
								this.position = pos
								break
						
						}

					}
				
					break
					
				case ST_TAG:
				
					let pos = start; while (true) {

						pos = body.indexOf ('>', pos + 1); if (pos === -1) return
						
						if (!this.isClosing (pos)) continue

						this.publishTo (pos)

						this.setState (ST_TEXT)

						continue outer							

					}
				
				case ST_TAG_X:
				
					for (let pos = this.position + 1; pos < body.length; pos ++) {

						switch (body.charCodeAt (pos)) {
						
							case CH_SQUARE:
								
								switch (this.awaited) {
								
									case CL_DEAFULT:
										this.awaited = CL_SQ_1
										break
										
								}
								
								this.position = pos
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
	
		let lexeme = this.body.slice (this.start, ++ pos)

		this.start = pos
		
		if (lexeme.length !== 0) this.push (lexeme)

	}

	_flush (callback) {
	
		this.publishTo (this.body.length - 1)
		
		callback ()

	}
	
	getPosition () {
	
		let {beforeBody, start} = this
		
		return beforeBody + BigInt (start)
	
	}
	
	checkMaxLength () {
	
		const {body, maxLength} = this, size = body.length - this.start; 
		
		if (size <= maxLength) return

		const s = body.slice (0, size - 1), dump = JSON.stringify ([s])

		this.destroy (new Error (`The fragment ${dump} at position ${this.getPosition ()} exceeds maxLength=${maxLength}`))
	
	}
	
	_transform (chunk, _, callback) {
	
		if (Buffer.isBuffer (chunk)) chunk = this.decoder.write (chunk)

		this.body = this.body.slice (this.start) + chunk
		this.start = 0
		
		this.parse ()
		
		if (this.start > 0) this.beforeBody += BigInt (this.start)		
		this.checkMaxLength ()
		
		callback ()

	}
	
}

module.exports = XMLLexer