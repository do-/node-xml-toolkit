const CH_Q  = "'", CH_Q_CODE  =  CH_Q.charCodeAt (0)
const CH_QQ = '"', CH_QQ_CODE = CH_QQ.charCodeAt (0)

const AttributesMap = class extends Map {

	constructor (src, entityResolver = null, nsMap = null) {

		super ()

		this.src = src
		this._nsMap = nsMap

		{

			const {length} = src

			let start = 0; while (true) {

				const eqPosition = src.indexOf ('=', start); if (eqPosition === -1) break

				const key = src.substring (start, eqPosition).trim (); if (key.length === 0) throw Error (`Zero length attribute key at position ${start}: ` + JSON.stringify (src))

				let openingQuotePosition = eqPosition + 1; while (openingQuotePosition < length && src.charCodeAt (openingQuotePosition) <= 32) openingQuotePosition ++

				if (openingQuotePosition >= length) throw Error (`Attribute quote not found for ${key} at position ${start}: ` + JSON.stringify (src))

				let quote; switch (src.charCodeAt (openingQuotePosition)) {

					case CH_QQ_CODE: 
						quote = CH_QQ
						break

					case CH_Q_CODE: 
						quote = CH_Q
						break

					default:
						throw Error (`Invalid attribute quote (${src.charAt (openingQuotePosition)}) for ${key} at position ${start}: ` + JSON.stringify (src))
						
				}

				const closingQuotePosition = src.indexOf (quote, openingQuotePosition + 1); if (closingQuotePosition === -1) throw Error (`Unclosed attribute ${key} at position ${start}: ` + JSON.stringify (src))

				start = closingQuotePosition + 1

				let value = src.substring (openingQuotePosition + 1, closingQuotePosition)

				if (value.length === 0) {

					value = null

				}
				else if (entityResolver) {

					value = entityResolver.fix (value)

				}

				if (nsMap !== null && key.startsWith ('xmlns') && nsMap.processAttribute (key, value)) continue

				this.set (key, value)

			}
	
		}

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

}

module.exports = AttributesMap