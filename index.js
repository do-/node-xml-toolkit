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
	'XMLIterator',
	'XMLParser',

]) module.exports [name] = require ('./lib/' + name)