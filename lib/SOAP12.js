const fs          = require ('fs')
const path        = require ('path')

const XMLSchemata = require ('./XMLSchemata.js')
//const SOAPHTTP    = require ('./SOAPHTTP.js')
const SOAPFault   = require ('./SOAPFault.js')

//const WSDL = {namespaceURI: 'http://schemas.xmlsoap.org/wsdl/'}

let _xs = null

const get_xs = () => {

	if (_xs === null) _xs = new XMLSchemata (path.join (path.dirname (module.filename), 'soap-1.2.xsd'))

	return _xs

}

const SOAP12 = class {

}

//SOAP12.namespaceURI = 'http://schemas.xmlsoap.org/wsdl/soap/'

const _fault_xml = ({code, message, actor, detail}) => {

	if (typeof code === 'string') code = {localName: code, namespaceURI: 'http://www.w3.org/2003/05/soap-envelope'}

	const Fault = {
		Reason: {Text: message}, 
		Code: {Value: code}, 
		Role: actor, 
		Detail: detail
	}
		
	return get_xs ().stringify ({Fault})

}

SOAP12.message = (body, header) => {

	if (!Array.isArray (body)) body = [body, {}]

	if (body [0] instanceof SOAPFault) body [0] = _fault_xml (body [0])

	let Envelope = {Body: XMLSchemata.any (body)}
	
	if (header != null) Envelope.Header = XMLSchemata.any (header)
	
	return get_xs ().stringify ({Envelope})

}

module.exports = SOAP12