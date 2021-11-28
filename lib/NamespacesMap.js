const NamespacesMap = class extends Map {

	constructor (xmlNode) {

		const {parent} = xmlNode
		
		if (parent === null) {
		
			super ()
		
		}
		else {

			super (parent.namespacesMap)

		}

	}

	getNamespaceURI (name, useDefault = false) {

		const pos = name.indexOf (':'), noColon = pos === -1
		
		if (noColon && !useDefault) return null
		
		const key = noColon ? '' : name.slice (0, pos)
		
		if (!this.has (key)) return null
		
		return this.get (key)

	}

}

module.exports = NamespacesMap