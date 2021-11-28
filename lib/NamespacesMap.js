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

}

module.exports = NamespacesMap