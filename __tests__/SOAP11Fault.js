const Path = require ('path')
const {execSync} = require ('child_process')
const {SOAP11, SOAPFault} = require ('../')

const xsdPath = Path.join (__dirname, '..', 'lib', 'soap-1.1.xsd')
const validate = input => execSync (`xmllint --schema ${xsdPath} -`, {input, stdio: 'pipe'})

test ('basic', () => {

	const fault = new SOAPFault ('Test Message', {detail: '<id>1</id>'})

	const err = SOAP11.createError (fault)

	expect (err.expose).toBe (true)
	expect (err.statusCode).toBe (500)
	expect (err.message).toMatch (':Server</faultcode>')
	expect (err.message).toMatch ('>Test Message<')
	expect (err.message).toMatch ('detail><id>1</id></')
	expect (err.headers).toStrictEqual ({'Content-Type': 'text/xml'})

	validate (err.message)

})

test ('code', () => {

	const fault = new SOAPFault ('Test Message', {code: {localName: 'Fate', namespaceURI: 'http://schemas.xmlsoap.org/soap/envelope/'}})

	const err = SOAP11.createError (fault)

	expect (err.message).toMatch (':Fate</faultcode>')

	validate (err.message)
	
})