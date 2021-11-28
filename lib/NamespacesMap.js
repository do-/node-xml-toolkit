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

	getNamespaceURI (name) {

		const pos = name.indexOf (':')
		
		return this.get (pos === -1 ? '' : name.slice (0, pos)) || null

	}

}

module.exports = NamespacesMap