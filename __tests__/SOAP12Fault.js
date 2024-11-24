const Path = require ('path')
const {execSync} = require ('child_process')
const {SOAP12, SOAPFault, XMLSchemata} = require ('../')

const xsdPath = Path.join (__dirname, '..', 'lib', 'soap-1.2.xsd')
const validate = input => execSync (`xmllint --schema ${xsdPath} -`, {input, stdio: 'pipe'})

test ('basic', () => {

	const fault = new SOAPFault ('Test Message', {})

	const err = SOAP12.createError (fault)

	expect (err.expose).toBe (true)
	expect (err.statusCode).toBe (500)
	expect (err.message).toMatch (':Receiver</') 
	expect (err.message).toMatch ('>Test Message<')
	expect (err.headers).toStrictEqual ({'Content-Type': 'application/soap+xml'})

	validate (err.message)

})
