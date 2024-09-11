const {SOAP12, SOAPFault} = require ('../')

test ('basic', () => {

	const fault = new SOAPFault ('Test Message', {})

	const err = SOAP12.createError (fault)

	expect (err.statusCode).toBe (500)
//	expect (err.message).toMatch (':Server<') 
	expect (err.message).toMatch ('>Test Message<')
	expect (err.headers).toStrictEqual ({'Content-Type': 'application/soap+xml'})

})