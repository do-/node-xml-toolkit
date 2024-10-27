const {XMLNamespace, XMLNamespacePrefix} = require ('./NamespacesMap.js')

const XMLSchema = require ('./XMLSchema.js')

const DEFAULTS = [
	[XMLNamespace, XMLNamespacePrefix],
	[XMLSchema.namespaceURI, 'xs'],
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

		if (!this.has (namespaceURI)) throw Error ('Unknown target namespace: ' + namespaceURI)

		return this.get (namespaceURI) + ':' + localName

	}

	toString () {
	
		let s = ''

		for (let [k, v] of this.entries ()) if (k !== XMLNamespace) s += ' xmlns:' + v + '="' + k + '"'
		
		return s

	}

}

module.exports = NamespacePrefixesMap