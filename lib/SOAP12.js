const path        = require ('path')
const XMLSchemata = require ('./XMLSchemata.js')
const SOAPFault   = require ('./SOAPFault.js')

let _xs = null

const get_xs = () => {

	if (_xs === null) _xs = new XMLSchemata (path.join (path.dirname (module.filename), 'soap-1.2.xsd'))

	return _xs

}

const SOAP12 = class {

	constructor (fn) {
	
		this.definitions = []
		
		if (fn) this.xs = new XMLSchemata (fn)
	
	}
	
	http (body, header) {

		if (!Array.isArray (body)) body = [body, {}]
		
		body [0] = this.xs.stringify (body [0])
	
		return {
			method: 'POST',
			headers: {'Content-Type': 'application/soap+xml; charset=utf-8'},
			body: SOAP12.message (body, header)
  		}
	
	}

}

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