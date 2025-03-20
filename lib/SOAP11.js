const path        = require ('path')
const createError = require ('http-errors')

const XMLSchemata = require ('./XMLSchemata.js')
const XMLNode     = require ('./XMLNode.js')
const SOAPFault   = require ('./SOAPFault.js')

const WSDL = {namespaceURI: 'http://schemas.xmlsoap.org/wsdl/'}

const _contentType = 'text/xml'

let _xs = null

const get_xs = () => {

	if (_xs === null) _xs = new XMLSchemata (path.join (path.dirname (module.filename), 'soap-1.1.xsd'))

	return _xs

}

const _fault_xml = ({code, message, actor, detail}) => {

	let faultcode = code ?? 'Server'

	if (typeof faultcode === 'string') faultcode = {localName: faultcode, namespaceURI: 'http://schemas.xmlsoap.org/soap/envelope/'}

	const Fault = {
		faultstring: message,
		faultcode, 
		faultactor: actor,
		detail
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

const SOAP11 = class {

	constructor (fn) {
	
		this.definitions = []
				
		this.xs = new XMLSchemata (fn)
			
		for (const doc of this.xs.documents) 

			if (doc.localName === 'definitions' && doc.namespaceURI === WSDL.namespaceURI)
				
				this.definitions.push (doc)
	
	}

	getMessageLocalNameByElementLocalName (elementLocalName) {
	
		for (const d of this.definitions) for (const m of d.children) if (m.localName === 'message') 

			for (const p of m.children) if (p.localName === 'part') 
			
				if (XMLNode.getLocalName (p.attributes.get ('element')) === elementLocalName)
				
					return m.attributes.get ('name')
	
	}
	
	getOperationNameByMessageLocalName (messageLocalName) {

		for (const d of this.definitions) for (const p of d.children) if (p.localName === 'portType') 

			for (const o of p.children) if (o.localName === 'operation') 

				for (const i of o.children) if (i.localName === 'input')

					if (XMLNode.getLocalName (i.attributes.get ('message')) === messageLocalName)

						return o.attributes.get ('name')

	}
	
	
	getSoapActionByOperationName (operationName) {

		for (const d of this.definitions) for (const b of d.children) if (b.localName === 'binding') 

			for (const o of b.children) if (o.localName === 'operation' && o.attributes.get ('name') === operationName) 

				for (const so of o.children)

					return so.attributes.get ('soapAction')

		for (const d of this.definitions) for (const p of d.children) if (p.localName === 'portType') 

			for (const o of p.children) if (o.attributes.get ('name') === operationName) 

				for (const i of o.children) if (i.localName === 'input') 

					return i.attributes.get ('Action', 'http://www.w3.org/2006/05/addressing/wsdl')

	}
	
	
	getSoapActionByElementLocalName (elementLocalName) {
	
		return this.getSoapActionByOperationName (
		
			this.getOperationNameByMessageLocalName (

				this.getMessageLocalNameByElementLocalName (elementLocalName)

			)

		)
	
	}
	
	http (body, header) {

		if (!Array.isArray (body)) body = [body, {}]
		
		const encoding = 'UTF-8'
		
		let headers = {'Content-Type': _contentType + '; charset=' + encoding.toLowerCase ()}
		
		for (const elementLocalName in body [0]) headers.SOAPAction = this.getSoapActionByElementLocalName (elementLocalName) ?? ''

		body [0] = this.xs.stringify (body [0])
	
		return {
			method: 'POST',
			headers,
			body: _message (body, header, {declaration: {encoding}})
  		}
	
	}

}

SOAP11.namespaceURI = 'http://schemas.xmlsoap.org/wsdl/soap/'
SOAP11.contentType  = _contentType

SOAP11.fromFile = async function (fn) {

	return new SOAP11 (fn)
	
}

SOAP11.createError = fault => createError (500, SOAP11.message (fault), {expose: true, headers: {'Content-Type': _contentType}})

SOAP11.message = _message

module.exports = SOAP11