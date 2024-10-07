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
/*
	xml = doc.toString ({space: 2, decl: {}})
	
	execSync (`xmllint --schema ${xsdPath} -`, {input: xml, stdio: 'pipe'})
*/
	return dump (doc)

}

const xformSync = async (data, code) => xform (data, code, getXSSync)
const xformASync = async (data, code) => xform (data, code, getXSASync)

const get2 = async (code, postfix) => {

	let fn = '../__data__/' + code

	if (postfix) fn += '-' + postfix

	const data = require (fn)

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

test ('30441-1', async () => {

	const [data, obj] = await get2 (30441, 1)

	expect (obj).toStrictEqual (data)

})

test ('30441-2', async () => {

	const [data, obj] = await get2 (30441, 2)

	const rd = data.ExportDebtRequestsResponse ['request-data']

	rd.result = String (rd.result)
	rd.period ['end-date'] = rd.period ['end-date'].toJSON ().substring (0, 10)
	rd.subrequest.response ['has-debt'] = String (rd.subrequest.response ['has-debt'])

	expect (obj).toStrictEqual (data)

})

test ('30442-1', async () => {

	const [data, obj] = await get2 (30442, 1)

	expect (obj).toStrictEqual (data)

})

test ('30442-2', async () => {

	const [data, obj] = await get2 (30442, 2)

	expect (obj).toStrictEqual (data)

})

test ('nillable', () => {

	const xs = getXSSync (Path.join (__dirname, '..', '__data__', 'F9ASyncService_1.xsd'))

	const m = xs.createMarshaller ('Person', 'http://schemas.datacontract.org/2004/07/GetForm9ASync', {space: 2})

	const xml = m.stringify ({
		LastName: 'LastName',
		FirstName: 'FirstName',
		SecondName: null,
		BirthDate: new Date (0),
	})

	expect (xml).toMatch ('SecondName xsi:nil="true"')

})
