const fs          = require ('fs')

const XMLSchemata = require ('./XMLSchemata.js')
const XMLReader   = require ('./XMLReader.js')
const XMLNode     = require ('./XMLNode.js')
const SOAPHTTP    = require ('./SOAPHTTP.js')

const SOAP11 = class {

	getMessageLocalNameByElementLocalName (elementLocalName) {
	
		for (const m of this.definitions.children) if (m.localName === 'message') 

			for (const p of m.children) if (p.localName === 'part') 
			
				if (XMLNode.getLocalName (p.attributes.get ('element')) === elementLocalName)
				
					return m.attributes.get ('name')
	
	}
	
	getOperationNameByMessageLocalName (messageLocalName) {

		for (const p of this.definitions.children) if (p.localName === 'portType') 

			for (const o of p.children) if (o.localName === 'operation') 

				for (const i of o.children) if (i.localName === 'input')

					if (XMLNode.getLocalName (i.attributes.get ('message')) === messageLocalName)

						return o.attributes.get ('name')

	}
	
	
	getSoapActionByOperationName (operationName) {

		for (const b of this.definitions.children) if (b.localName === 'binding') 

			for (const o of b.children) if (o.localName === 'operation' && o.attributes.get ('name') === operationName) 

				for (const so of o.children) if (o.localName === 'operation') 

					return so.attributes.get ('soapAction')

	}
	
	
	getSoapActionByElementLocalName (elementLocalName) {
	
		return this.getSoapActionByOperationName (
		
			this.getOperationNameByMessageLocalName (

				this.getMessageLocalNameByElementLocalName (elementLocalName)

			)

		)
	
	}
	
	toSOAPHTTP (o) {
		
		let rq = new SOAPHTTP ('1.1')

		for (const elementLocalName in o) {

			const SOAPAction = this.getSoapActionByElementLocalName (elementLocalName)

			if (SOAPAction) rq.http.headers.SOAPAction = SOAPAction

		}

		rq.soap.Body.content = this.xs.stringify (o)
		
		return rq.build ()
	
	}

	http (o) {
	
		return this.toSOAPHTTP (o).http
	
	}

}

const WSDL = {namespaceURI: 'http://schemas.xmlsoap.org/wsdl/'}

SOAP11.namespaceURI = 'http://schemas.xmlsoap.org/wsdl/soap/'

SOAP11.fromFile = async function (fn, options = {}) {

	let s = new SOAP11 ()
	
	s.xs = await XMLSchemata.fromFile (fn)
	
	s.definitions = await new XMLReader ({
		filterElements: e => 
			e.namespaceURI === WSDL.namespaceURI && 
			e.localName    === 'definitions'
	}).process (fs.createReadStream (fn)).findFirst ()		

	return s

}

module.exports = SOAP11