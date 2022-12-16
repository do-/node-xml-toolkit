const path        = require ('path')
const XMLSchemata = require ('./XMLSchemata.js')
const SOAPFault   = require ('./SOAPFault.js')

let _xs = null

const _contentType = 'application/soap+xml'

const get_xs = () => {

	if (_xs === null) _xs = new XMLSchemata (path.join (path.dirname (module.filename), 'soap-1.2.xsd'))

	return _xs

}

const _fault_xml = ({code, message, actor, detail, lang}) => {

	if (typeof code === 'string') code = {localName: code, namespaceURI: 'http://www.w3.org/2003/05/soap-envelope'}

	const Fault = {
		Reason: {Text: {lang, null: message}},
		Code: {Value: code}, 
		Role: actor, 
		Detail: detail
	}
		
	return get_xs ().stringify ({Fault})

}

const _message = (body, header, o) => {

	if (!Array.isArray (body)) body = [body, {}]

	if (body [0] instanceof SOAPFault) body [0] = _fault_xml (body [0])

	let Envelope = {Body: XMLSchemata.any (body)}
	
	if (header != null) Envelope.Header = XMLSchemata.any (header)
	
	return get_xs ().stringify ({Envelope}, o)

}

const SOAP12 = class {

	constructor (fn) {
	
		this.definitions = []
		
		if (fn) this.xs = new XMLSchemata (fn)
	
	}
	
	http (body, header) {

		if (!Array.isArray (body)) body = [body, {}]
		
		const encoding = 'UTF-8'
		
		body [0] = this.xs.stringify (body [0])
	
		return {
			method: 'POST',
			headers: {'Content-Type': _contentType +'; charset=' + encoding.toLowerCase ()},
			body: _message (body, header, {declaration: {encoding}})
  		}
	
	}

}

SOAP12.contentType = _contentType

SOAP12.message = _message

module.exports = SOAP12