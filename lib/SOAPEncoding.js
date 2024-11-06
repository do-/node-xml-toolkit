const util = require ('util')

const XMLSchema = require ('./XMLSchema.js')

const NS_XSI     = 'http://www.w3.org/2001/XMLSchema-instance'
const NS_SOAP    = 'http://xml.apache.org/xml-soap'
const NS_SOAPENC = 'http://schemas.xmlsoap.org/soap/encoding/'

const SOAPEncoding = class {

	constructor (options = {}) {

		this.emptyScalar = options.emptyScalar

	}

	decodeMap ({children}) {

		const result = {}

		for (const {children: [{children: [{src}]}, value]} of children) {

			const v = this.decode (value)

			if (v === undefined) continue

			result [src] = v

		}

		return result

	}

	decodeArray ({children}) {

		return children.map (value => this.decode (value))

	}

	decodeScalar ({children}) {

		if (children.length === 0) return this.emptyScalar

		return children [0].src

	}

	decode (node) {

		const {attributes} = node

		const nil = attributes.get ('nil', NS_XSI); if (nil === 'true' || nil === '1') return null

		const type = attributes.get ('type', NS_XSI); if (!type) throw Error ('xsi:type not defined: ' + util.inspect(node))
			
		const [namespacePrefix, localName] = type.split (':'), namespaceURI = attributes._nsMap.get (namespacePrefix)

		switch (namespaceURI) {

			case XMLSchema.namespaceURI: return this.decodeScalar (node)

			case NS_SOAP:
				if (localName !== 'Map') throw Error (`Don't know how to decode ${localName} from ${namespaceURI}`)
				return this.decodeMap (node)

			case NS_SOAPENC:
				if (localName !== 'Array') throw Error (`Don't know how to decode ${localName} from ${namespaceURI}`)
				return this.decodeArray (node)

			default:
				throw Error (`Don't know how to decode ${localName} from ${namespaceURI}`)

		}

	}

}

module.exports = SOAPEncoding