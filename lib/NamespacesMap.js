const CH_COLON = ':'.charCodeAt (0)

const XMLNamespace       = 'http://www.w3.org/XML/1998/namespace'
const XMLNamespacePrefix = 'xml'

const XMLSchemaNamespace       = 'http://www.w3.org/2001/XMLSchema'
const XMLSchemaNamespacePrefix = 'xs'

const DEFAULTS = [
	[XMLNamespacePrefix,       XMLNamespace],
//	[XMLSchemaNamespacePrefix, XMLSchemaNamespace],
]

const NamespacesMap = class extends Map {

	constructor (xmlNode) {

		const {parent} = xmlNode
		
		if (parent === null) {
		
			super (DEFAULTS)
		
		}
		else {

			super (parent.namespacesMap)

		}

	}

	processAttribute (key, value) {

		if (key.length === 5) {

			this.set ('', this.default = value)

		}
		else {

			if (key.charCodeAt (5) !== CH_COLON) return false

			this.set (key.slice (6), value)			

		}

		return true

	}

	getNamespaceURI (name, useDefault = false) {

		const pos = name.indexOf (':'), noColon = pos === -1
		
		if (noColon && !useDefault) return null
		
		const key = noColon ? '' : name.slice (0, pos)
		
		if (!this.has (key)) return null
		
		return this.get (key)

	}
	
	* getQNames (localName, namespaceURI) {
	
		for (let [k, v] of this.entries ()) 
		
			if (v === namespaceURI) 
				
				yield k === '' ? localName : 
				
					k + ':' + localName
	
	}

}

NamespacesMap.XMLNamespace             = XMLNamespace
NamespacesMap.XMLNamespacePrefix       = XMLNamespacePrefix
NamespacesMap.XMLSchemaNamespace       = XMLSchemaNamespace
NamespacesMap.XMLSchemaNamespacePrefix = XMLSchemaNamespacePrefix

module.exports = NamespacesMap