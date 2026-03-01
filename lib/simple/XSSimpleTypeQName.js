const {XSSimpleType} = require ('./XSSimpleType.js')
const NamespacePrefixesMap = require ('../NamespacePrefixesMap.js')

class XSSimpleTypeQName extends XSSimpleType {

	get name () {
		return 'QName'
	}

	stringify (value) {

		if (typeof value !== 'object' || !('localName' in value)) this.blame (value)

		const {xs} = this

		if (!xs.ns) xs.ns = new NamespacePrefixesMap (xs)

		return xs.ns.QName (value.localName, value.namespaceURI)

	}
			
}

module.exports = XSSimpleTypeQName