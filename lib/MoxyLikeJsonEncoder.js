const SAXEvent = require ('./SAXEvent.js'), {CHARACTERS, END_ELEMENT} = SAXEvent.TYPES

const GET_LOCAL_NAME = (localName, namespaceURI) => localName

const MoxyLikeJsonEncoder = function (options = {}) {

	let {getName} = options; if (!getName) getName = GET_LOCAL_NAME

	const xform = ({children, attributes}) => {

		let o = null

		const set = (nv, localName, namespaceURI) => {
		
			const k = getName (localName, namespaceURI)

			if (o === null) return o = {[k]: nv}

			if (!(k in o)) return o [k] = nv

			const ov = o [k]; if (!Array.isArray (ov)) return o [k] = [ov, nv]

			ov.push (nv)

		}

		if (attributes != null)
					
			for (const [name, value] of attributes.entries ())
			
				set (value, attributes.getLocalName (name), attributes.getNamespaceURI (name))

		if (children != null) for (const child of children) switch (child.type) {

			case CHARACTERS:
			
				return child.text

			case END_ELEMENT:

				set (xform (child), child.localName, child.namespaceURI)

		}

		return o

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