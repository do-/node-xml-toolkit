const Path = require ('path')
const {execSync} = require ('child_process')
const {XMLSchemata, XMLParser, XMLNode} = require ('../')
const {Readable, Writable} = require ('node:stream')

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

test ('30094', async () => {

	const [data, obj] = await get2 (30094)

	expect (obj).toStrictEqual (data)

})

test ('30368', async () => {

	const [data, obj] = await get2 (30368)

	expect (obj).toStrictEqual (data)

})

test ('30681', async () => {

	const [data, obj] = await get2 (30681)

	expect (obj).toStrictEqual (data)

})

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

test ('30213', async () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', '30213', 'RequestEGRN_v018', 'RequestEGRN_v01.xsd')

	const xs = new XMLSchemata (xsdPath)

	const data = {
	
		"EGRNRequest": {
			"_id": "3bfc06ce-08b2-11f0-a65d-005056a50a67",
			"header": {
			  "actionCode": "659511111112",
			  "statementType": "558630200000",
			  "creationDate": "2025-04-08T11:16:03.185874+03:00"
			},
			"declarant": {
			  "_id": "c543c4c1-6dd4-e8a7-7441-e66f394ae716",
			  "other": {
				"contactInfo": {
				  "phoneNumber": "+78121111111",
				  "email": "subsidii@gcjs.gk.gov.spb.ru"
				},
				"name": "СПб ГКУ \"Городской центр жилищных субсидий\"",
				"inn": "7842111111",
				"ogrn": "1177811111111",
				"kpp": "784201001",
				"regDate": "2017-11-01"
			  },
			  "declarantKind": "357013000000"
			},
			"requestDetails": {
			  "requestEGRNDataAction": {
				"extractDataAction": {
				  "object": {
					"objectTypeCode": "002001003000",
					"cadastralNumber": {
					  "cadastralNumber": "78:06:0002000:2000"
					},
					"address": null
				  },
				  "requestType": "extractRealty"
				}
			  }
			},
			"deliveryDetails": {
			  "requestDeliveryMethod": {
				"receivingMethodCode": "electronically",
				"regRightAuthority": "ФГБУ ФКП Росреестра по Санкт-Петербургу",
				"code": "78.038"
			  },
			  "resultDeliveryMethod": {
				"recieveResultTypeCode": "webService"
			  }
			},
			"statementAgreements": {
			  "persDataProcessingAgreement": "01",
			  "actualDataAgreement": "03"
			}
		  }

	  }

	  expect (xs.stringify (data)).toMatch ('cadastralNumber>78:06:0002000:2000<')

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

test ('20319', async () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', '20319.wsdl')

	const xs = new XMLSchemata (xsdPath)

	const data = {
		getOrganizationsByEasRequestWrap: {
			Message: {
				TestMsg: "Тестовый запроc",
				Sender: {
					Code: "001801781",
					Name: "КИС СПб",
				},
				Recipient: {
					Code: "ESZHKU001",
					Name: "АС ЕС ЖКУ",
				},
				ServiceName:  "MOService",
				TypeCode:     "GFNC",
				Status:       "REQUEST",
				Date:         "2025-07-07",
				ExchangeType: "2"
			},
			MessageData: {
				AppData: {
					data: {
						[Symbol.for ('type')]: 'GetOrganizationsByEasRequest',
						eas:         123456,
						countRecord: 1,
						page:        1
					}
				}
			}
		}
	}

	expect (xs.stringify (data)).toMatch (/xsi:type="ns\d*:GetOrganizationsByEasRequest"/)

	expect (xs.stringify (data)).toMatch ('eas>123456<')

})

test ('null', () => {

	const xs = new XMLSchemata (Path.join (__dirname, '..', '__data__', 'smev-message-exchange-types-1.1.xsd'))

	const xml = xs.stringify ({AckResponse: null})

	expect (xml).toMatch ('ns2:AckResponse')

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

test ('form="unqualified"', () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', '202510', 'wsdl_112.xsd')

	const xs = getXSSync (xsdPath)

	function stringify (data, options) {

		const xml = xs.createMarshaller ('UpdateCardResponse', 'http://eiim.service112.iskratel.si/').stringify (data, options)

		execSync (`xmllint --schema ${xsdPath} -`, {input: xml, stdio: 'pipe'})

		return xml

	}

	let xml = stringify ({
		"Code": 200,
		"CodeDescr": "Descr"
	})

	expect (xml).toMatch ('<ns2:UpdateCardResponse xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:ns2=\"http://eiim.service112.iskratel.si/\"><Code>200</Code><CodeDescr>Descr</CodeDescr></ns2:UpdateCardResponse>')

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
	expect (() => xs.createMarshaller ('YetStatus').stringify ({id: '?'})).toThrow (/integer.*float/)
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

	expect (xs.ns.QName ('any', 'http://www.w3.org/2001/XMLSchema')).toBe ('xs:any')
	expect (() => xs.ns.QName ('any', 'https://www.w3.org/2001/XMLSchema')).toThrow ()

})

test ('stream', async () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', 'qa_104_response.xsd')

	const xs = new XMLSchemata (xsdPath)

	const ACCOUNT = [
		{
			"PERIOD_ACC": "2023-06",
			"RSO_ACC": "123114561",
			"N_ACC": "1",
			"SQ_PAY": "33.00",
			"PREMISE_GUID": "052d06fd-05db-41a0-8436-70ff27ad1a63",
			"FLAT": "15",
			"OBJECT_ADDRESS": "Address 1",
			"OBJECT_GUID": "8ff34cba-d277-48e2-daa5-6c94e8e26552",
			"LS_TYPE": "1",
			"LS_ID": "47497585",
			"RES_CODE": "0",
			"SRV": {
				"SRV_CODE": "HOT",
				"SRV_SUM": "116.68",
				"SRV_NORM": "3.48",
				"SRV_TRF": "116.68",
				"TRF_OKEI": "113"
			}
		},
		{
			"PERIOD_ACC": "2023-06",
			"RSO_ACC": "123112590",
			"N_ACC": "1",
			"SQ_PAY": "52.60",
			"PREMISE_GUID": "8443ad15-8be2-4740-a1a5-a04510f556b5",
			"FLAT": "2",
			"OBJECT_ADDRESS": "Address 2",
			"OBJECT_GUID": "12458473-be5d-4dd5-9a9d-3d6b4783b7db",
			"LS_TYPE": "1",
			"LS_ID": "47126247",
			"RES_CODE": "0",
			"SRV": {
				"SRV_CODE": "HOT",
				"SRV_SUM": "750.10",
				"SRV_NORM": "3.43",
				"SRV_TRF": "26.68",
				"TRF_OKEI": "113"
			}
		},
	]

	const data = { 
		"PERIOD": "2023-06",
		"RSO_CODE": "142087",
		ACCOUNT
	}

	const m0 = xs.createMarshaller ('QA', 'http://msp.gcjs.spb/QA/1.0.4', {space: '  '})

	const sample = m0.stringify (data)

	data.ACCOUNT = Readable.from (data.ACCOUNT)

	let xml = ''

	const out = new Writable ({
		write (chunk, encoding, callback) {
			xml += chunk.toString ()
			callback ()
		}		
	})

	const m = xs.createMarshaller ('QA', 'http://msp.gcjs.spb/QA/1.0.4', {space: '  ', out})

	m.stringify (data)

	await new Promise ((ok, fail) => out.on ('error', fail).on ('finish', ok))

	expect (xml).toBe (sample)

})