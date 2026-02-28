const Path = require ('path')
const {XMLSchemata, XMLParser, XMLNode} = require ('..')

function messUp (xs, xml, asIs, toBe, err, debug = false) {

	if (debug) console.log (xml)	

	const brokenXml = xml.replaceAll (asIs, toBe)

	if (debug) console.log (brokenXml)

	expect (() => new XMLParser ({xs}).process (brokenXml)).toThrow (err)

}

describe ('any', () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', 'schemas.xmlsoap.org.xml')

	const xs = new XMLSchemata (xsdPath)

	test ('basic', () => {
		
		const p = new XMLParser ({xs, stripSpace: false})		

		const doc = p.process (`
			<SOAP-ENV:Envelope
				xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
				SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"
			>
			<SOAP-ENV:Body>
				<m:GetLastTradePrice xmlns:m="Some-URI">
					<symbol>DIS</symbol>
				</m:GetLastTradePrice>
			</SOAP-ENV:Body>
			</SOAP-ENV:Envelope>			
		`)

	})


})

describe ('30213', () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', '30213', 'RequestEGRN_v026.xsd')

	const xs = new XMLSchemata (xsdPath)

		const data = {
		
			"EGRNRequest": {
				"build": "26.001",
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

	const m = xs.createMarshaller ('EGRNRequest', 'http://rosreestr.ru/services/v0.26/TStatementRequestEGRN', {space: 2})

	const xml = m.stringify (data.EGRNRequest)

	test ('bad options', () => {

		expect (() => new XMLParser ({xs, useNamespaces: false})).toThrow ('prov')

	})

	test ('unknown ns', () => {

		messUp (xs, xml, '"http://rosreestr.ru/services/v0.26/TStatementRequestEGRN"', '"http://tempuri.org"', 'Unknown namespace: http://tempuri.org')

	})

	test ('unknown root element', () => {

		messUp (xs, xml, ':EGRNRequest', ':OGRNRequest', 'OGRNRequest is not found in http://rosreestr.ru/services/v0.26/TStatementRequestEGRN')

	})

	test ('root not element', () => {

		messUp (xs, xml, ':EGRNRequest', ':TEGRNRequest', 'is not found')

	})

	test ('Unexpected element', () => {

		messUp (xs, xml, '<ns4:actionCode>', '<ns26:inn>7842111111</ns26:inn><ns4:actionCode>', 'Unexpected element')

	})

	test ('Unexpected element', () => {

		messUp (xs, xml, '<ns4:actionCode>659511111112</ns4:actionCode>', '<ns4:actionCode><ns4:actionCode>659511111112</ns4:actionCode></ns4:actionCode>', 'No nested')

	})

	test ('Unknown attribute', () => {

		messUp (xs, xml, '_id=', '_iddqd=', 'Unknown attribute')

	})

	test ('Missing required attribute', () => {

		messUp (xs, xml, '_id="c543c4c1-6dd4-e8a7-7441-e66f394ae716"', '', 'Missing required attribute')

	})

	test ('Fixed attribute', () => {

		messUp (xs, xml, '26.001', '26.002', 'must have')

	})

	test ('Enumeration', () => {

		messUp (xs, xml, '>electronically<', '>protonically<', "not in list")
		
	})

	test ('Pattern mismatch', () => {

		messUp (xs, xml, '>558630200000<', '>558630201000<', "doesn't match any")
		messUp (xs, xml, '>659511111112<', '>659511111119<', "doesn't match any")

	})

})

describe ('sign', () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', 'sign.xsd')

	const xs = new XMLSchemata (xsdPath)

	const xml = `<ds:Signature xmlns:ds=\"http://www.w3.org/2000/09/xmldsig#\"><ds:SignedInfo><ds:CanonicalizationMethod /><!--Algorithm=\"...\"/>--><ds:SignatureMethod Algorithm=\"urn:ietf:params:xml:ns:cpxmlsec:algorithms:gostr34102012-gostr34112012-256\"/><ds:Reference URI=\"#U9552f341-4b2b-4cb3-b0b5-fea58fa165e1\"><ds:Transforms><ds:Transform Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\"/><ds:Transform Algorithm=\"urn://smev-gov-ru/xmldsig/transform\"/></ds:Transforms><ds:DigestMethod Algorithm=\"urn:ietf:params:xml:ns:cpxmlsec:algorithms:gostr34112012-256\"/><ds:DigestValue>AImuCtsc7A93rRPOxHu7iFE92qguBs8Iab318zTHJcc=</ds:DigestValue></ds:Reference></ds:SignedInfo><ds:SignatureValue>5O18yV7M7x1w83bsuEqGI+HnroWBjUq6T4Um6uk+o/Vh16DHD6aG53TaVP6vp8zONyRThidV2Jut0Gbep8fNFg==</ds:SignatureValue><ds:KeyInfo><ds:X509Data><ds:X509Certificate>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</ds:X509Certificate></ds:X509Data></ds:KeyInfo></ds:Signature>`

	test ('default attr', () => {

		const p = new XMLParser ({xs, stripSpace: false})

		const doc = XMLNode.toObject () (p.process (xml))

		expect (doc.SignedInfo.CanonicalizationMethod.Algorithm).toBe ('http://www.w3.org/2001/10/xml-exc-c14n#')

	})

})

describe ('att', () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', 'att.xsd')

	const xs = new XMLSchemata (xsdPath)

	const xml = `<ns2:GetStatus xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:ns2="http://tempuri.org/" a="1970-01-01" />`

	test ('basic', () => {

		const p = new XMLParser ({xs, stripSpace: false})

		const doc = XMLNode.toObject () (p.process (xml))

	})

})

describe ('qa_104_response', () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', 'qa_104_response.xsd')

	const xs = new XMLSchemata (xsdPath)

	const xml = `
      <ns2:QA xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:ns2="http://msp.gcjs.spb/QA/1.0.4" PERIOD="2023-06" RSO_CODE="142087">
        <ACCOUNT PERIOD_ACC="2023-06" RSO_ACC="123114561" N_ACC="1" SQ_PAY="33.00" PREMISE_GUID="052d06fd-05db-41a0-8436-70ff27ad1a63" FLAT="15" OBJECT_ADDRESS="Address 1" OBJECT_GUID="8ff34cba-d277-48e2-daa5-6c94e8e26552" LS_TYPE="1" LS_ID="47497585" RES_CODE="0">
          <SRV SRV_CODE="HOT" SRV_SUM="116.68" SRV_NORM="3.4800" SRV_TRF="116.68" TRF_OKEI="113" />
        </ACCOUNT>
        <ACCOUNT PERIOD_ACC="2023-06" RSO_ACC="123112590" N_ACC="1" SQ_PAY="52.60" PREMISE_GUID="8443ad15-8be2-4740-a1a5-a04510f556b5" FLAT="2" OBJECT_ADDRESS="Address 2" OBJECT_GUID="12458473-be5d-4dd5-9a9d-3d6b4783b7db" LS_TYPE="1" LS_ID="47126247" RES_CODE="0">
          <SRV SRV_CODE="HOT" SRV_SUM="750.10" SRV_NORM="3.4300" SRV_TRF="26.68" TRF_OKEI="113" />
        </ACCOUNT>
      </ns2:QA>	
	`

	test ('enum', () => {

		messUp (xs, xml, 'SRV_CODE="HOT"', 'SRV_CODE="COLD"', "not in list")

	})

})

describe ('30213', () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', '30681.xsd')

	const xs = new XMLSchemata (xsdPath)

		const data = {
		
			"livingPlaceRegistrationResponse": {
				"personInfo": {
					"lastName": "Ппппп",
					"firstName": "Жжжжж",
					"middleName": "Иаиаиаиа",
					"birthDate": "1970-01-01"
				},
				"document": {
					"russianPassport": {
						"series": "5555",
						"number": "000000",
						"issueDate": "2000-01-11"
					}
				},
				"regAddressType": "2417603178217346987",
				// "notFoundRegistration": true
				"regAddressItem": {
					"fromDt": "2022-03-31",
					"adressGUID": "b0d84e8b-9821-6647-41af-663fa7b52b20",
					"fullAddress": "СССР"
				}
			}

		}

	const m = xs.createMarshaller ('livingPlaceRegistrationResponse', 'urn://mvd/gismu/export-living-place-registration/1.2.0', {space: 2})

	const xml = m.stringify (data.livingPlaceRegistrationResponse)

	test ('attributeGroup', () => {

		const p = new XMLParser ({xs, stripSpace: false})

		const doc = p.process (xml)

	})

})
