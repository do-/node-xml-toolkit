const Attributes = class {

	constructor (src) {
		this.src = src
	}
	
	*[Symbol.iterator] () {

		for (let [, k1, v1, k2, v2] of this.src.matchAll (/([^\s=]+)='([^']+)'|([^\s=]+)="([^"]+)"/g)) // "'

	        yield k2 == null ? [k1, v1] : [k2, v2]

    }
    
    toMap () {
    
    	return new Map (this)
    
    }

    toObject () {
    
    	return Object.fromEntries (this)
    
    }
	
}

module.exports = Attributes