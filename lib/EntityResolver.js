const CH_HASH    = '#'.charCodeAt (0)
const CH_X       = 'x'.charCodeAt (0)

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

		let start = s.indexOf ('&'); if (start === -1) return s
		
		let r = s.slice (0, start)
		
		const {body} = this
		
		while (true) {

			let end = s.indexOf (';', ++ start); if (end === -1) throw new Error ('Unterminated entity reference in ' + JSON.stringify ([s]))

			const key = s.slice (start, end)

			if (body.has (key)) {

				r += body.get (key)

			}
			else if (key.charCodeAt (0) === CH_HASH) {						

				const charCode = key.charCodeAt (1) === CH_X ? parseInt (key.slice (2), 16) : parseInt (key.slice (1), 10)
				
				if (isNaN (charCode) || charCode <= 0) throw Error ('Invalid character reference ' + key + ' in ' + JSON.stringify ([s]))

				const c = String.fromCharCode (charCode)
				
				body.set (key, c)
				
				r += c

			}
			else {

				throw Error ('Unknown entity reference ' + key + ' in ' + JSON.stringify ([s]))

			}
			
			start = s.indexOf ('&', ++ end)
			
			if (start === -1) return r + s.slice (end)
			
			r += s.slice (end, start)
			
		}

	}

}

module.exports = EntityResolver