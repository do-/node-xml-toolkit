const XMLReader  = require ('./XMLReader.js')

const CH_HASH    = '#'.charCodeAt (0)

const PREDEFINED = new Map ([
	['lt'   , '<'],
	['gt'   , '>'],
	['quot' , '"'],
	['amp'  , '&'],
	['apos' , "'"],
])

const EntityResolver = class {

	constructor () {

		this.body = new Map (PREDEFINED)

	}
	
	fix (s) {
console.log ({s})	
		let start = s.indexOf ('&'); if (start === -1) return s
		
		let r = s.slice (0, start)
		
		const {body} = this
		
		while (true) {

			let end = s.indexOf (';', ++ start); if (end === -1) throw new Error ('Unterminated entity reference in ' + JSON.stringify ([s]))

			const key = s.slice (start, end)

			if (body.has (key)) {

				r += body.get (key)

			}
			else {

				const charCode = key.charCodeAt (0) === CH_HASH ? parseInt (key.slice (1), 16) : parseInt (key, 10)
				
				if (isNaN (charCode) || charCode <= 0) throw new Error ('Unknown entity reference ' + key + ' in ' + JSON.stringify ([s]))
				
				const c = String.fromCharCode (charCode)
				
				body.set (key, c)
				
				r += c

			}
			
			start = s.indexOf ('&', ++ end)
			
			if (start === -1) return r + s.slice (end)
			
			r += s.slice (end, start)
			
		}

	}

}

module.exports = EntityResolver