const assert = require ('assert')

const NamespacePrefixesMap = class extends Map {

	constructor (schemata, node) {
	
		super ()
		
		this.schemata = schemata
		
		this.checkNode (node)

	}
	
	checkNode ({targetNamespace, attributes, children}) {
	
		this.checkURI (targetNamespace)
	
		for (const a of Object.values (attributes))
		
			if (Array.isArray (a) && a.length === 2)

				this.checkURI (a [1])

		for (const i of children) this.checkNode (i)
	
	}
	
	checkURI (uri) {

		if (this.has (uri)) return

		if (!this.schemata.has (uri)) return

		this.set (uri, 'ns' + this.size)

	}
	
	QName (localName, namespaceURI) {
	
		if (namespaceURI == null || !this.has (namespaceURI)) return localName
		
		return this.get (namespaceURI) + ':' + localName
	
	}

	appendTo (buf) {

		for (let [k, v] of this.entries ()) buf [0] += ' xmlns:' + v + '="' + k + '"'

	}

}

module.exports = NamespacePrefixesMap