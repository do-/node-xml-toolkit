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

test ('20040', async () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', '20040.wsdl')

	const xs = new XMLSchemata (xsdPath)

	const data = {
	
		"AppData": {
		  "info": {
			"person": {
			  "fNameCiv": "ППП",
			  "iNameCiv": "ППП",
			  "mNameCiv": null,
			  "docDatCiv": "1973-03-01"
			},
			"snils": "022-114-680 91",
			"document": {
			  "codeKind": "01",
			  "numDoc": "999999",
			  "seriesDoc": "9999",
			  "dateDoc": "2022-03-05"
			},
			"startDate": "2021-08-01",
			"endDate": "2022-01-31T00:00:00",
			"child": {
			  "fNameCiv": "ООО",
			  "iNameCiv": "ООО",
			  "mNameCiv": null,
			  "docDatCiv": "2022-02-08"
			},
			"childDocument": {
			  "codeKind": "03",
			  "numDoc": "333333",
			  "seriesDoc": "333333333",
			  "dateDoc": "2022-03-01"
			},
			"childSnils": "109-598-827 12"
		  }
		}
	  
	  }, {info} = data.AppData
	    
	  const d = {childDotation2Request: {			
		  Message: {
			  TestMsg: "Тестовый запроc",
		  },
		  MessageData: {
			  AppData: {
				  info
			  }
		  }
	  }}	

	  expect (xs.stringify (d)).toMatch ('childSnils>109-598-827 12<')

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

test ('att simple type', () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', 'att.xsd')

	const xs = getXSSync (xsdPath)

	const m = xs.createMarshaller ('GetStatus')

	function stringify (data, options) {

		const xml = xs.createMarshaller ('GetStatus').stringify (data, options)

		execSync (`xmllint --schema ${xsdPath} -`, {input: xml, stdio: 'pipe'})

		return xml

	}

	expect (stringify ({integer: 11})).toMatch ('>11<')
	expect (stringify ({nonNegativeInteger: 11})).toMatch ('>11<')
	expect (stringify ({positiveInteger: 11})).toMatch ('>11<')
	expect (stringify ({nonPositiveInteger: -11})).toMatch ('>-11<')
	expect (stringify ({negativeInteger: -11})).toMatch ('>-11<')
	expect (stringify ({id: '1', a: 0}, {declaration: {}})).toMatch (/^<\?xml version="1.0"\?>.*? a="1970-01-01".*?>1</)
	expect (stringify ({id: 1, dt: 0}, 'GetStatus')).toMatch (' dt="1970-01-01')
	expect (stringify ({double: '3.14'})).toMatch ('>3.14<')
	expect (stringify ({double: Infinity})).toMatch ('>INF<')
	expect (stringify ({double: -Infinity})).toMatch ('>-INF<')
	expect (stringify ({float: '3.14'})).toMatch ('>3.14<')
	expect (stringify ({float: Infinity})).toMatch ('>INF<')
	expect (stringify ({float: -Infinity})).toMatch ('>-INF<')
	expect (stringify ({boolean: 0})).toMatch ('>false<')
	expect (stringify ({boolean: '0'})).toMatch ('>false<')
	expect (stringify ({decimal: '1'})).toMatch ('>1.00<')
	expect (stringify ({decimal: 1})).toMatch ('>1.00<')
	expect (stringify ({decimal: 1n})).toMatch ('>1.00<')
	expect (stringify ({dateTime: '1970-01-01T00:00:00'})).toMatch ('>1970-01-01T00:00:00<')
	expect (stringify ({dateTime: '1970-01-01'})).toMatch ('>1970-01-01T00:00:00<')
	expect (stringify ({dec: 0})).toMatch ('>0<')
	expect (stringify ({dec: 0n})).toMatch ('>0<')
	expect (stringify ({id: 0})).toMatch ('>0<')
	expect (stringify ({id: 0n})).toMatch ('>0<')
	expect (stringify ({q: {localName: 'a', namespaceURI: 'http://www.w3.org/2001/XMLSchema'}})).toMatch ('>xs:a<')

	expect (xs.createMarshaller ('SetStatus').stringify ({id: 1})).toMatch ('>1<')
	expect (xs.createMarshaller ('BetStatus').stringify ({id: 1, a: 0})).toMatch (' a="0"')

	expect (() => m.stringify ({q: '1970-01-01T'})).toThrow ()

	expect (() => m.stringify ({decimal: NaN})).toThrow ()
	expect (() => m.stringify ({decimal: Symbol ('')})).toThrow ()
	expect (() => m.stringify ({decimal: true})).toThrow ()

	expect (() => m.stringify ({double: Symbol ('')})).toThrow ()
	expect (() => m.stringify ({float: Symbol ('')})).toThrow ()
	expect (() => m.stringify ({id: Symbol ('')})).toThrow ()
	expect (() => m.stringify ({n: Symbol ('')})).toThrow ()
	expect (() => m.stringify ({n: 3.14})).toThrow ()
	expect (() => m.stringify ({id: 1, a: []})).toThrow ()
	expect (() => m.stringify ({id: 1, dt: []})).toThrow ()

	expect (() => xs.stringify (null)).toThrow ()
	expect (() => xs.stringify (0)).toThrow ()
	expect (() => xs.stringify ({})).toThrow ('exactly 1')
	expect (() => xs.stringify ({a: 1, b: 2})).toThrow ('exactly 1')	

	expect (() => xs.getType (['0', '0'])).toThrow ()
	expect (() => xs.getByReference (['0', '0'])).toThrow ()
	expect (() => xs.getSchemaByLocalName ('0')).toThrow ()
	expect (() => xs.getSchemaByLocalName ('date')).toThrow ()

})