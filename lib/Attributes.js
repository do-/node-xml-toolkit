const Attributes = class {

	constructor (src) {
	
		this.src = src
		
		this.body = []
		
		for (let [, k1, v1, k2, v2] of this.src.matchAll (/([^\s=]+)='([^']+)'|([^\s=]+)="([^"]+)"/g)) // "'
		
			this.body.push (k2 == null ? [k1, v1] : [k2, v2])
		
	
	}
	
	*[Symbol.iterator] () {
	
		for (const i of this.asArray ()) yield i
    
    }

	asArray () {

		return this.body

    }
    
    asMap () {
    
    	return new Map (this.asArray ())
    
    }

    asObject () {
    
    	return Object.fromEntries (this.asArray ())
    
    }
	
}

module.exports = Attributes