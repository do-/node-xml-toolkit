const assert = require ('assert')
const {

	XMLNamespace,
	XMLNamespacePrefix,
	XMLSchemaNamespace,
	XMLSchemaNamespacePrefix,

} = require ('./NamespacesMap.js')

const DEFAULTS = [
	[XMLNamespace,       XMLNamespacePrefix],
	[XMLSchemaNamespace, XMLSchemaNamespacePrefix],
]

const NamespacePrefixesMap = class extends Map {

	constructor (schemata) {

		super (DEFAULTS)

		for (const uri of schemata.keys ()) 			

			if (!this.has (uri))
		
				this.set (uri, 'ns' + this.size)
		
	}

	QName (localName, namespaceURI) {

		if (namespaceURI == null) return localName

		assert (this.has (namespaceURI), 'Unknown target namespace: ' + namespaceURI)

		return this.get (namespaceURI) + ':' + localName
	
	}

	toString () {
	
		let s = ''

		for (let [k, v] of this.entries ()) if (k !== XMLNamespace) s += ' xmlns:' + v + '="' + k + '"'
		
		return s

	}

}

module.exports = NamespacePrefixesMap