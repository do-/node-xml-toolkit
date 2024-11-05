const {TYPES: {CHARACTERS, END_ELEMENT}} = require ('./SAXEvent.js')

const MoxyLikeJsonEncoder = function (options = {}) {

	const getName = options.getName ?? (_ => _)

	const xform = ({children, attributes}) => {

		let result = null

		const set = (newValue, localName, namespaceURI) => {
		
			const key = getName (localName, namespaceURI)

			if (result === null) return result = {[key]: newValue}

			if (!(key in result)) return result [key] = newValue

			const oldValue = result [key]; if (!Array.isArray (oldValue)) return result [key] = [oldValue, newValue]

			oldValue.push (newValue)

		}
					
		for (const [name, value] of attributes.entries ())
			
			set (value, attributes.getLocalName (name), attributes.getNamespaceURI (name))

		for (const child of children) switch (child.type) {

			case CHARACTERS:
			
				return child.text

			case END_ELEMENT:

				set (xform (child), child.localName, child.namespaceURI)

		}

		return result

	}

	return function (node) {
	
		let result = xform (node)
		
		const {wrap, map} = options

		if (wrap) result = {[getName (node.localName, node.namespaceURI)]: result}
		
		if (map) result = map (result)

		return result

	}

}

module.exports = MoxyLikeJsonEncoder