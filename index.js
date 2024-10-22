const {
	XSSimpleType,
	XSSimpleTypeFloat,
} = require ('./lib/XSSimpleType')

module.exports = {
	AttributesMap:       require ('./lib/AttributesMap'),	
	EntityResolver:      require ('./lib/EntityResolver'),	
	MoxyLikeJsonEncoder: require ('./lib/MoxyLikeJsonEncoder'),
	SOAP11:              require ('./lib/SOAP11'),
	SOAP12:              require ('./lib/SOAP12'),
	SOAPEncoding:        require ('./lib/SOAPEncoding'),
	SOAPFault:           require ('./lib/SOAPFault'),
	SAXEvent:            require ('./lib/SAXEvent'),
	XMLIterator:         require ('./lib/XMLIterator'),
	XMLNode:             require ('./lib/XMLNode'),
	XMLLexer:            require ('./lib/XMLLexer'),
	XMLParser:           require ('./lib/XMLParser'),
	XMLPrinter:          require ('./lib/XMLPrinter'),
	XMLReader:           require ('./lib/XMLReader'),
	XMLSchemata:         require ('./lib/XMLSchemata'),
	XSSimpleType,
	XSSimpleTypeFloat
}

module.exports.SOAP = v => {switch (String (v)) {

	case '1.1': return module.exports.SOAP11
	
	case '1.2': return module.exports.SOAP12
	
	default: throw new Error ('Unknown SOAP version: ' + v)
	
}}