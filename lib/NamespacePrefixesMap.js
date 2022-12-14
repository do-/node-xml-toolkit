const assert = require ('assert')

const NamespacePrefixesMap = class extends Map {

	constructor (schemata) {

		super ([['http://www.w3.org/2001/XMLSchema-instance', 'xsi']])
		
		for (const uri of schemata.keys ()) 
		
			this.set (uri, 'ns' + this.size)
		
	}

	QName (localName, namespaceURI) {

		if (namespaceURI == null) return localName

		assert (this.has (namespaceURI), 'Unknown target namespace: ' + namespaceURI)

		return this.get (namespaceURI) + ':' + localName
	
	}

	toString () {
	
		let s = ''

		for (let [k, v] of this.entries ()) s += ' xmlns:' + v + '="' + k + '"'
		
		return s

	}

}

module.exports = NamespacePrefixesMap