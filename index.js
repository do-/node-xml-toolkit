for (const name of [

	'XMLLexer',
	'XMLReader',
	'SAXEvent',
	'AttributesMap',
	'MoxyLikeJsonEncoder',
	'XMLNode',
	'XMLSchemata',
	'SOAP11',
	'SOAP12',
	'EntityResolver',
	'XMLIterator',
	'XMLParser',
	'SOAPFault',

]) module.exports [name] = require ('./lib/' + name)

module.exports.SOAP = v => {switch (String (v)) {

	case '1.1': return module.exports.SOAP11
	
	case '1.2': return module.exports.SOAP12
	
	default: throw new Error ('Unknown SOAP version: ' + v)
	
}}