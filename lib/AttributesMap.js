const CH_COLON = ':'.charCodeAt (0)

const AttributesMap = class extends Map {

	constructor (entityResolver = null, nsMap = null) {

		super ()

		this.entityResolver = entityResolver
		this._nsMap = nsMap

	}

	getLocalName (name) {

		return (require ('./XMLNode.js')).getLocalName (name)

	}

	getNamespaceURI (name) {

		return this._nsMap.getNamespaceURI (name)

	}

	get (name, namespaceURI = null) {
	
		if (namespaceURI === null) return super.get (name)
		
		for (const k of this._nsMap.getQNames (name, namespaceURI)) {
		
			if (!this.has (k)) continue
			
			return this.get (k)

		}
	
	}
	
	set (k, v) {
	
		const {_nsMap} = this; if (_nsMap !== null) {

			if (k.slice (0, 5) === 'xmlns') {
			
				if (k.length === 5) {

					_nsMap.set ('', v)

					return this

				}

				if (k.charCodeAt (5) === CH_COLON) {

					_nsMap.set (k.slice (6), v)

					return this

				}
			
			}

		}

		const {entityResolver} = this

		return super.set (k,

			v === ''                ? null : 

			entityResolver === null ? v    :
			
			entityResolver.fix (v)
			
		)

	}

}

module.exports = AttributesMap