for (const name of [

	'XMLLexer',
	'XMLReader',
	'SAXEvent',
	'AttributesMap',
	'MoxyLikeJsonEncoder',
	'XMLNode',
	'XMLSchemata',
	'SOAP11',
	'EntityResolver',

]) module.exports [name] = require ('./lib/' + name)