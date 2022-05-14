const assert = require ('assert')

const NamespacePrefixesMap = class extends Map {

	constructor (schemata) {
	
		super ()
		
		for (const uri of schemata.keys ()) 
		
			this.set (uri, 'ns' + this.size)
		
	}

	QName (localName, namespaceURI) {

		if (namespaceURI == null) return localName

		if (!this.has (namespaceURI)) throw new Error ('Unknown target namespace: ' + namespaceURI)

		return this.get (namespaceURI) + ':' + localName
	
	}

	appendTo (buf) {

		for (let [k, v] of this.entries ()) buf [0] += ' xmlns:' + v + '="' + k + '"'

	}

}

module.exports = NamespacePrefixesMap