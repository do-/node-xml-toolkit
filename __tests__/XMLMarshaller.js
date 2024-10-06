const Path = require ('path')
const {execSync} = require ('child_process')
const {XMLSchemata, XMLParser, XMLNode} = require ('../')

const dump = XMLNode.toObject ({wrap: true})

const getXSSync  = xsdPath => new XMLSchemata (xsdPath)
const getXSASync = xsdPath => XMLSchemata.fromFile (xsdPath)

const xform = async (data, code, getXS) => {

	const xsdPath = Path.join (__dirname, '..', '__data__', code + '.xsd')

	const xs = await getXS (xsdPath)

	let xml  = xs.stringify (data)

	execSync (`xmllint --schema ${xsdPath} -`, {input: xml, stdio: 'pipe'})

	const doc  = new XMLParser ().process (xml)

	xml = doc.toString ({space: 2, decl: {}})
	
	execSync (`xmllint --schema ${xsdPath} -`, {input: xml, stdio: 'pipe'})

	return dump (doc)

}

const xformSync = async (data, code) => xform (data, code, getXSSync)
const xformASync = async (data, code) => xform (data, code, getXSASync)

const get2 = async (code) => {

	const data = require (`../__data__/${code}.json`)

	const [oSync, oASync] = await Promise.all ([
		xformSync (data, code),
		xformASync (data, code),
	])

	expect (oSync).toStrictEqual (oASync)

	return [data, oSync]

}

test ('30017', async () => {

	const [data, obj] = await get2 (30017)

	delete data.FNSINNSingularRequest ['СведФЛ'] ['МестоРожд']

	expect (obj).toStrictEqual (data)

})
