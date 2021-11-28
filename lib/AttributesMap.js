const CH_COLON = ':'.charCodeAt (0)

const AttributesMap = class extends Map {

	constructor (xmlReader, nsMap = null) {

		super ()

		this._xmlReader = xmlReader
		this._nsMap = nsMap

		this.fixText = xmlReader.fixText

	}

	getLocalName (name) {

		return (require ('./XMLNode.js')).getLocalName (name)

	}

	getNamespaceURI (name) {

		return this._nsMap.getNamespaceURI (name)

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

		return super.set (k, this.fixText (v))

	}

}

module.exports = AttributesMap