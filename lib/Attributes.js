const CH_SPACE  =  ' '.charCodeAt (0)
const CH_CR     = '\r'.charCodeAt (0)
const CH_LF     = '\n'.charCodeAt (0)
const CH_TAB    = '\t'.charCodeAt (0)

const Attributes = class {

	constructor (src) {
		
		const m = new Map ()

		let start = 0; while (true) {

			const eq = src.indexOf ('=', start); if (eq === -1) break

			const  q = src.indexOf (src.charAt (eq + 1), eq + 2); if (q === -1) break

			let k = src.slice (start, eq)
			
			if (start === 0) {
			
				let p = k.length - 2; loop: while (p !== 0) switch (k.charCodeAt (p)) {
					case CH_SPACE:
					case CH_CR:
					case CH_LF:
					case CH_TAB:
						break loop
					default:
						p --
				}

				k = k.slice (p + 1)

			}
			else {
			
				k = k.trim ()
			
			}			

			m.set (k, src.slice (eq + 2, q))

			start = q + 1
		
		}
		
		this.m = m
	
	}

    asMap () {
    
    	return this.m
        
    }

    asObject () {

    	return Object.fromEntries (this.m)
        
    }

}

module.exports = Attributes