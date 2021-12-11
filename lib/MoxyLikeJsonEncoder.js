const SAXEvent = require ('./SAXEvent.js')

const set = (o, k, nv) => {

	if (!(k in o)) return o [k] = nv

	const ov = o [k]; if (!Array.isArray (ov)) o [k] = [ov]
	
	o [k].push (nv)

}

const xform = ({children, attributes}) => {

	let o = Object.fromEntries (attributes.entries ())

	if (children !== null) for (const child of children) switch (child.type) {

		case SAXEvent.TYPES.CHARACTERS:  return child.text

		case SAXEvent.TYPES.END_ELEMENT: set (o, child.localName, xform (child))

	}
	
	return o

}

const MoxyLikeJsonEncoder = function (options = {}) {

	return function (node) {
	
		let result = xform (node)
	
		return options.wrap ? {[node.localName]: result} : result
			
	}

}

module.exports = MoxyLikeJsonEncoder