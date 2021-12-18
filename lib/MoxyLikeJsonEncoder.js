const SAXEvent = require ('./SAXEvent.js'), {CHARACTERS, END_ELEMENT} = SAXEvent.TYPES

const set = (o, k, nv) => {

	if (!(k in o)) return o [k] = nv

	const ov = o [k]; if (!Array.isArray (ov)) o [k] = [ov]
	
	o [k].push (nv)

}

const xform = ({children, attributes}) => {

	let o = null

	if (attributes != null && attributes.size !== 0) o = Object.fromEntries (attributes.entries ())

	if (children != null) for (const child of children) switch (child.type) {

		case CHARACTERS:  return child.text

		case END_ELEMENT:
		
			if (o === null) o = {}
			
			set (o, child.localName, xform (child))

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