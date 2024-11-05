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

		const {_nsMap} = this; if (!_nsMap) return null

		return _nsMap.getNamespaceURI (name)

	}

	get (name, namespaceURI = null) {
	
		if (namespaceURI === null) return super.get (name)
		
		for (const k of this._nsMap.getQNames (name, namespaceURI)) {
		
			if (!this.has (k)) continue
			
			return this.get (k)

		}
	
	}

	set (k, v) {
	
		const {_nsMap, entityResolver} = this
		
		if (_nsMap !== null && k.startsWith ('xmlns') && _nsMap.processAttribute (k, v)) return this

		return super.set (k,

			v === ''                ? null :

			entityResolver === null ? v    :
			
			entityResolver.fix (v)
			
		)

	}

}

module.exports = AttributesMap