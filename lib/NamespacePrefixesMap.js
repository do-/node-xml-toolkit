const assert = require ('assert')

const NamespacePrefixesMap = class extends Map {

	constructor (schemata, o) {
	
		assert.strictEqual (typeof o, 'object')

		super ()
		
		this.schemata = schemata
		
		this.add (o)
		
	}
	
	add (o) {

		if (this.isAddedAsNamespaceReference (o)) return
		
		for (let v of Object.values (o)) if (typeof v === 'object') this.add (v)
	
	}
	
	isAddedAsNamespaceReference (a) {

		if (!Array.isArray (a)) return false
		
		if (a.length !== 2) return false
		
		const uri = a [1]
		
		if (!this.schemata.has (uri)) return false

		if (this.has (uri)) return true
		
		this.set (uri, 'ns' + this.size)
		
	}

}

module.exports = NamespacePrefixesMap