const Path = require ('path')
const {XMLSchemata, XMLParser} = require ('..')

function messUp (xs, xml, asIs, toBe, err, debug = false) {

	if (debug) console.log (xml)	

	const brokenXml = xml.replaceAll (asIs, toBe)

	if (debug) console.log (brokenXml)

	expect (() => new XMLParser ({xs}).process (brokenXml)).toThrow (err)

}

describe ('30213', () => {

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

	const m = xs.createMarshaller ('EGRNRequest', 'http://rosreestr.ru/services/v0.18/TStatementRequestEGRN', {space: 2})

	const xml = m.stringify (data.EGRNRequest)

	test ('bad options', () => {

		expect (() => new XMLParser ({xs, useNamespaces: false})).toThrow ('prov')

	})

	test ('unknown ns', () => {

		messUp (xs, xml, '"http://rosreestr.ru/services/v0.18/TStatementRequestEGRN"', '"http://tempuri.org"', 'Unknown namespace: http://tempuri.org')

	})

	test ('unknown root element', () => {

		messUp (xs, xml, ':EGRNRequest', ':OGRNRequest', 'OGRNRequest is not found in http://rosreestr.ru/services/v0.18/TStatementRequestEGRN')

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

	// test ('XMLParser basic', () => {

	// 	const p = new XMLParser ({xs, stripSpace: false})

	// 	const doc = p.process (xml)

	// })

})