const {SOAP11, SOAPFault} = require ('../')

test ('basic', () => {

	const fault = new SOAPFault ('Test Message', {detail: 111})

	const err = SOAP11.createError (fault)

	expect (err.statusCode).toBe (500)
	expect (err.message).toMatch (':Server</faultcode>')
	expect (err.message).toMatch ('>Test Message<')
	expect (err.message).toMatch ('detail>111</')
	expect (err.headers).toStrictEqual ({'Content-Type': 'text/xml'})

})

test ('basic', () => {

	const fault = new SOAPFault ('Test Message', {detail: 111, code: {localName: 'Fate', namespaceURI: 'http://schemas.xmlsoap.org/soap/envelope/'}})

	const err = SOAP11.createError (fault)

	expect (err.message).toMatch (':Fate</faultcode>')
	
})