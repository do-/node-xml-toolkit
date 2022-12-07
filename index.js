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