const Path = require ('path')
const {XMLSchemata, XMLReader, XMLParser, XMLNode} = require ('..')

async function messUp (xs, xml, asIs, toBe, err, debug = false) {

	if (debug) console.log (xml)	

	const brokenXml = xml.replaceAll (asIs, toBe)

	if (debug) console.log (brokenXml)

	expect (() => new XMLParser ({xs}).process (brokenXml)).toThrow (err)

	expect (new Promise ((ok, fail) => {

		const a = []; new XMLReader ({
			filterElements : e => e.level === 1, 
			map: XMLNode.toObject ({}),
			xs,
		})
			.on ('error', fail)
			.on ('close', () => ok (a))
			.on ('data', r => a.push (r))
				.process (brokenXml)

	})).rejects.toThrow (err)

}

describe ('any', () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', 'schemas.xmlsoap.org.xml')

	const xs = new XMLSchemata (xsdPath)

	test ('basic', async () => {
		
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

	const xml = `<ns2:EGRNRequest xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:ns2="http://rosreestr.ru/services/v0.26/TStatementRequestEGRN" xmlns:ns3="http://rosreestr.ru/services/v0.26/commons/Commons" xmlns:ns4="http://rosreestr.ru/services/v0.26/TStatementCommons" xmlns:ns5="http://rosreestr.ru/services/v0.26/commons/TObject" xmlns:ns6="http://rosreestr.ru/services/v0.26/commons/Address" xmlns:ns7="http://rosreestr.ru/services/v0.26/commons/directories/house" xmlns:ns8="http://rosreestr.ru/services/v0.26/commons/Commons/simple-types" xmlns:ns9="http://rosreestr.ru/services/v0.26/commons/directories/roomPurpose" xmlns:ns10="http://rosreestr.ru/services/v0.26/commons/directories/objectPurpose" xmlns:ns11="http://rosreestr.ru/services/v0.26/commons/directories/housingPurpose" xmlns:ns12="http://rosreestr.ru/services/v0.26/commons/directories/objectType" xmlns:ns13="http://rosreestr.ru/services/v0.26/commons/directories/unitType" xmlns:ns14="http://rosreestr.ru/services/v0.26/commons/directories/usageType" xmlns:ns15="http://rosreestr.ru/services/v0.26/commons/directories/interdepobjecttype" xmlns:ns16="http://rosreestr.ru/services/v0.26/commons/Subjects" xmlns:ns17="http://rosreestr.ru/services/v0.26/commons/Documents" xmlns:ns18="http://rosreestr.ru/services/v0.26/commons/directories/document" xmlns:ns19="http://rosreestr.ru/services/v0.26/commons/directories/requestDocument" xmlns:ns20="http://rosreestr.ru/services/v0.26/commons/directories/contractor" xmlns:ns21="http://rosreestr.ru/services/v0.26/commons/directories/country" xmlns:ns22="http://rosreestr.ru/services/v0.26/commons/directories/regionrf" xmlns:ns23="http://rosreestr.ru/services/v0.26/commons/directories/benefitCategory" xmlns:ns24="http://rosreestr.ru/services/v0.26/commons/directories/declarantKind" xmlns:ns25="http://rosreestr.ru/services/v0.26/commons/directories/declarantKindReg" xmlns:ns26="http://rosreestr.ru/services/v0.26/commons/directories/encumbrance" xmlns:ns27="http://rosreestr.ru/services/v0.26/commons/directories/agreements" xmlns:ns28="http://rosreestr.ru/services/v0.26/commons/directories/actionCode" xmlns:ns29="http://rosreestr.ru/services/v0.26/commons/directories/statementType" xmlns:ns30="http://rosreestr.ru/services/v0.26/commons/directories/recieveResultType" xmlns:ns31="http://rosreestr.ru/services/v0.26/commons/directories/receivingMethod" xmlns:ns32="http://rosreestr.ru/services/v0.26/commons/directories/kindInfo" xmlns:ns33="http://rosreestr.ru/services/v0.26/commons/directories/terzone" xmlns:ns34="http://rosreestr.ru/services/v0.26/commons/directories/borderObjectType" xmlns:ns35="http://rosreestr.ru/services/v0.26/commons/directories/LandCategory" _id="3bfc06ce-08b2-11f0-a65d-005056a50a67" build="26.001">
        <ns2:header>
          <ns4:actionCode>659511111112</ns4:actionCode>
          <ns4:statementType>558630200000</ns4:statementType>
          <ns4:creationDate>2025-04-08T11:16:03.185874+03:00</ns4:creationDate>
        </ns2:header>
        <ns2:declarant _id="c543c4c1-6dd4-e8a7-7441-e66f394ae716">
          <ns16:other>
            <ns16:contactInfo>
              <ns16:phoneNumber>+78121111111</ns16:phoneNumber>
              <ns16:email>subsidii@gcjs.gk.gov.spb.ru</ns16:email>
            </ns16:contactInfo>
            <ns16:name>СПб ГКУ "Городской центр жилищных субсидий"</ns16:name>
            <ns16:inn>7842111111</ns16:inn>
            <ns16:ogrn>1177811111111</ns16:ogrn>
            <ns16:kpp>784201001</ns16:kpp>
            <ns16:regDate>2017-11-01</ns16:regDate>
          </ns16:other>
          <ns16:declarantKind>357013000000</ns16:declarantKind>
        </ns2:declarant>
        <ns2:requestDetails>
          <ns2:requestEGRNDataAction>
            <ns2:extractDataAction>
              <ns2:object>
                <ns5:objectTypeCode>002001003000</ns5:objectTypeCode>
                <ns5:cadastralNumber>
                  <ns5:cadastralNumber>78:06:0002000:2000</ns5:cadastralNumber>
                </ns5:cadastralNumber>
              </ns2:object>
              <ns2:requestType>extractRealty</ns2:requestType>
              <ns2:isDepositary>true</ns2:isDepositary>
            </ns2:extractDataAction>
          </ns2:requestEGRNDataAction>
        </ns2:requestDetails>
        <ns2:deliveryDetails>
          <ns4:requestDeliveryMethod>
            <ns4:receivingMethodCode>electronically</ns4:receivingMethodCode>
            <ns4:regRightAuthority>ФГБУ ФКП Росреестра по Санкт-Петербургу</ns4:regRightAuthority>
            <ns4:code>78.038</ns4:code>
          </ns4:requestDeliveryMethod>
          <ns4:resultDeliveryMethod>
            <ns4:recieveResultTypeCode>webService</ns4:recieveResultTypeCode>
          </ns4:resultDeliveryMethod>
        </ns2:deliveryDetails>
        <ns2:statementAgreements>
          <ns4:persDataProcessingAgreement>01</ns4:persDataProcessingAgreement>
          <ns4:actualDataAgreement>03</ns4:actualDataAgreement>
        </ns2:statementAgreements>
      </ns2:EGRNRequest>`

	test ('bad options', async () => {

		expect (() => new XMLParser ({xs, useNamespaces: false})).toThrow ('prov')

	})

	test ('unknown ns', async () => {

		await messUp (xs, xml, '"http://rosreestr.ru/services/v0.26/TStatementRequestEGRN"', '"http://tempuri.org"', 'Unknown namespace: http://tempuri.org')

	})

	test ('unknown root element', async () => {

		await messUp (xs, xml, ':EGRNRequest', ':OGRNRequest', 'OGRNRequest is not found in http://rosreestr.ru/services/v0.26/TStatementRequestEGRN')

	})

	test ('root not element', async () => {

		await messUp (xs, xml, ':EGRNRequest', ':TEGRNRequest', 'is not found')

	})

	test ('Unexpected element', async () => {

		await messUp (xs, xml, '<ns4:actionCode>', '<ns26:inn>7842111111</ns26:inn><ns4:actionCode>', 'nexpected')

	})

	test ('Unexpected element', async () => {

		await messUp (xs, xml, '<ns4:actionCode>659511111112</ns4:actionCode>', '<ns4:actionCode><ns4:actionCode>659511111112</ns4:actionCode></ns4:actionCode>', 'No nested')

	})

	test ('Unknown attribute', async () => {

		await messUp (xs, xml, '_id=', '_iddqd=', 'Unknown attribute')

	})

	test ('Missing required attribute', async () => {

		await messUp (xs, xml, '_id="c543c4c1-6dd4-e8a7-7441-e66f394ae716"', '', 'Missing required attribute')

	})

	test ('Fixed attribute', async () => {

		await messUp (xs, xml, '26.001', '26.002', 'must have')

	})

	test ('Enumeration', async () => {

		await messUp (xs, xml, '>electronically<', '>protonically<', "not in list")
		
	})

	test ('Pattern mismatch', async () => {

		await messUp (xs, xml, '>558630200000<', '>558630201000<', "doesn't match any")
		await messUp (xs, xml, '>659511111112<', '>659511111119<', "doesn't match any")

	})

	test ('bool', async () => {

		await messUp (xs, xml, 'isDepositary>true<', 'isDepositary><', "bool")
		await messUp (xs, xml, 'isDepositary>true<', 'isDepositary>True<', "not a bool")

	})

	test ('date', async () => {

		await messUp (xs, xml, 'regDate>2017-11-01<', 'regDate>2017-11-01T00:00:00<', "time part cannot be present")

	})

	test ('dateTime', async () => {

		await messUp (xs, xml, 'creationDate>2025-04-08T11:16:03.185874+03:00<', 'creationDate>2025-04-08Z<', "time part is mandatory")

	})

})

describe ('sign', () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', 'sign.xsd')

	const xs = new XMLSchemata (xsdPath)

	const xml = 
		`<ds:Signature xmlns:ds=\"http://www.w3.org/2000/09/xmldsig#\">
			<ds:KeyInfo>
				<ds:X509Data>
					<ds:X509Certificate>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</ds:X509Certificate>
				</ds:X509Data>
			</ds:KeyInfo>
			<ds:SignedInfo>
				<ds:CanonicalizationMethod /><!--Algorithm=\"...\"/>-->
				<ds:SignatureMethod Algorithm=\"urn:ietf:params:xml:ns:cpxmlsec:algorithms:gostr34102012-gostr34112012-256\"/>
				<ds:Reference URI=\"#U9552f341-4b2b-4cb3-b0b5-fea58fa165e1\">
					<ds:Transforms>
						<ds:Transform Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\"/>
						<ds:Transform Algorithm=\"urn://smev-gov-ru/xmldsig/transform\"/>
					</ds:Transforms>
					<ds:DigestMethod Algorithm=\"urn:ietf:params:xml:ns:cpxmlsec:algorithms:gostr34112012-256\"/>
					<ds:DigestValue>AImuCtsc7A93rRPOxHu7iFE92qguBs8Iab318zTHJcc=</ds:DigestValue>
				</ds:Reference>
			</ds:SignedInfo>
			<ds:SignatureValue>5O18yV7M7x1w83bsuEqGI+HnroWBjUq6T4Um6uk+o/Vh16DHD6aG53TaVP6vp8zONyRThidV2Jut0Gbep8fNFg==</ds:SignatureValue>
		</ds:Signature>`

	test ('default attr', async () => {

		const p = new XMLParser ({xs, stripSpace: true})

		const doc = XMLNode.toObject () (p.process (xml))

		expect (doc.SignedInfo.CanonicalizationMethod.Algorithm).toBe ('http://www.w3.org/2001/10/xml-exc-c14n#')

	})

})

describe ('att', () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', 'att.xsd')

	const xs = new XMLSchemata (xsdPath)

	test ('basic', async () => {

		const p = new XMLParser ({xs, stripSpace: false})

		const doc = XMLNode.toObject () (p.process (`<ns2:GetStatus xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:ns2="http://tempuri.org/" a="1970-01-01" />`))

	})

	test ('union', async () => {

		const p = new XMLParser ({xs, stripSpace: false})

		const doc = XMLNode.toObject () (p.process (`<ns2:BetStatus xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:ns2="http://tempuri.org/" a="1970-01-01" />`))

		expect (() => p.process (`<ns2:YetStatus xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:ns2="http://tempuri.org/"><ns2:id>?</ns2:id><YetStatus>`)).toThrow (/not a valid decimal.*?not a floating point/)

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

	test ('maxLength', async () => {

		await messUp (xs, xml, 'RSO_ACC="', 'RSO_ACC="00000000000000000000000000000000000000000000000000', "exceeds the allowed maximum")

	})

	test ('minLength', async () => {

		await messUp (xs, xml, 'RSO_ACC="123114561"', 'RSO_ACC=""', "which is less than the allowed minimum")

	})

	test ('minmax', async () => {

		await messUp (xs, xml, 'LS_TYPE="1"', 'LS_TYPE="0"', "less")
		await messUp (xs, xml, 'LS_TYPE="1"', 'LS_TYPE="9"', "greater")
		await messUp (xs, xml, 'SRV_NORM="', 'SRV_NORM="-', "less")
		await messUp (xs, xml, 'SRV_NORM="', 'SRV_NORM="10000000000', "greater")

	})

	test ('decimal', async () => {

		await messUp (xs, xml, 'SQ_PAY="33.00"', 'SQ_PAY=""', "empty")
		await messUp (xs, xml, 'SQ_PAY="33.00"', 'SQ_PAY="+"', "no digits")
		await messUp (xs, xml, 'SQ_PAY="33.00"', 'SQ_PAY="0+"', "begin")
		await messUp (xs, xml, 'SQ_PAY="33.00"', 'SQ_PAY="0..1"', "2nd period")
		await messUp (xs, xml, 'SQ_PAY="33.00"', 'SQ_PAY="3.76!"', "occured")
		await messUp (xs, xml, 'SQ_PAY="33.00"', 'SQ_PAY="1111111111111111111111111"', "only 10")
		await messUp (xs, xml, 'SQ_PAY="33.00"', 'SQ_PAY=".111111111"', "only 2")

	})

})

describe ('30681', () => {

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

	test ('length', async () => {

		await messUp (xs, xml, '5555', '555', "must be exaclty")

	})

})

describe ('all', () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', 'all.xsd')

	const xs = new XMLSchemata (xsdPath)

	test ('basic1', async () => {

		const xml = `<ns:client xmlns:ns="http://tempuri.org/">
			<ns:cl_lastname>Doe</ns:cl_lastname>
			<ns:cl_firstname>John</ns:cl_firstname>
		</ns:client>`

		const p = new XMLParser ({xs})

		const doc = XMLNode.toObject () (p.process (xml))

		expect (doc).toEqual ({
			cl_firstname: "John",
			cl_lastname: "Doe",
		})

	})

	test ('basic2', async () => {

		const xml = `<ns:client xmlns:ns="http://tempuri.org/">
			<ns:cl_firstname>John</ns:cl_firstname>
			<ns:cl_lastname>Doe</ns:cl_lastname>
		</ns:client>`

		const p = new XMLParser ({xs})

		const doc = XMLNode.toObject () (p.process (xml))

		expect (doc).toEqual ({
			cl_lastname: "Doe",
			cl_firstname: "John",
		})

	})

	test ('miss', async () => {

		const xml = `<ns:client xmlns:ns="http://tempuri.org/"><ns:cl_firstname>John</ns:cl_firstname></ns:client>`

		const p = new XMLParser ({xs})

		expect (() => p.process (xml)).toThrow (/<\/ns:client>.*<ns:cl_lastname>/)

	})

	test ('miss', async () => {

		const xml = `<ns:client xmlns:ns="http://tempuri.org/"><ns:cl_middlename>C.</ns:cl_middlename></ns:client>`

		const p = new XMLParser ({xs})

		expect (() => p.process (xml)).toThrow ('nexpected')

	})

})

describe ('choice', () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', 'choice.xsd')

	const xs = new XMLSchemata (xsdPath)

	test ('basic1', async () => {

		const xml = `<ns:client xmlns:ns="http://tempuri.org/">
			<ns:left>1</ns:left>
			<ns:left>2</ns:left>
		</ns:client>`

		const p = new XMLParser ({xs})

		const doc = XMLNode.toObject () (p.process (xml))

		expect (doc).toEqual ({left: ['1', '2']})

	})

	test ('basic2', async () => {

		const xml = `<ns:client xmlns:ns="http://tempuri.org/">
			<ns:right>1</ns:right>
			<ns:right>2</ns:right>
		</ns:client>`

		const p = new XMLParser ({xs})

		const doc = XMLNode.toObject () (p.process (xml))

		expect (doc).toEqual ({right: ['1', '2']})

	})

	test ('miss', async () => {

		const xml = `<ns:client xmlns:ns="http://tempuri.org/">
			<ns:left>1</ns:left>
			<ns:right>2</ns:right>
		</ns:client>`

		const p = new XMLParser ({xs})

		expect (() => p.process (xml)).toThrow (/expected.*left/)

	})

	test ('too few', async () => {

		const xml = `<ns:client10 xmlns:ns="http://tempuri.org/">
			<ns:left>1</ns:left>
			<ns:left>2</ns:left>
		</ns:client10>`

		const p = new XMLParser ({xs})

		expect (() => p.process (xml)).toThrow (/expected.*left/)

	})


})

describe ('empty extension', () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', 'gml_FeatureCollection.xsd')

	const xs = new XMLSchemata (xsdPath)

	test ('basic', () => {

		const p = new XMLParser ({xs})

		p.process (`<gml:FeatureCollection xmlns:gml="http://www.opengis.net/gml/3.2"><gml:featureMember/></gml:FeatureCollection>`)

	})

})

describe ('sequence', () => {

	const xsdPath = Path.join (__dirname, '..', '__data__', 'sequence.xsd')

	const xs = new XMLSchemata (xsdPath)	

	test ('miss', async () => {

		const xml = `<ns:client xmlns:ns="http://tempuri.org/">
			<ns:cl_firstname>John</ns:cl_firstname>
		</ns:client>`

		const p = new XMLParser ({xs})

		expect (() => p.process (xml)).toThrow (/expected.*?lastname.*?middlename>/)

	})

	test ('miss', async () => {

		const xml = `<ns:dummy xmlns:ns="http://tempuri.org/">
			<ns:dummier></ns:dummier>
		</ns:dummy>`

		const p = new XMLParser ({xs})

		expect (() => p.process (xml)).toThrow (/No nested/)

	})

	test ('empty', async () => {

		const xml = `<ns:dummy xmlns:ns="http://tempuri.org/"></ns:dummy>`

		const p = new XMLParser ({xs})

		const doc = XMLNode.toObject () (p.process (xml))

		expect (doc).toBeNull ()

	})

	test ('xsi:schemaLocation', () => {

		new XMLParser ({xs}).process ([
			`<ns:client`,
			` xmlns:ns="http://tempuri.org/"`,
			` xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`,
			` xsi:schemaLocation="http://tempuri.org/ sequence.xsd">`,
			`<ns:cl_firstname>John</ns:cl_firstname>`,
			`<ns:cl_lastname>Doe</ns:cl_lastname>`,
			`</ns:client>`,
		].join (''))

	})

	test ('XMLParser position', () => {

		const p = new XMLParser ({xs})

		expect (() => p.process (`<ns:client xmlns:ns="http://tempuri.org/"><ns:INVALID>x</ns:INVALID></ns:client>`)).toThrow (/^\[1:43\].*nexpected/)

		expect (() => p.process (`<ns:client xmlns:ns="http://tempuri.org/">\n<ns:INVALID>x</ns:INVALID>\n</ns:client>`)).toThrow (/^\[2:1\].*nexpected/)

	})

	test ('XMLReader position', async () => {

		const t = xml => new Promise ((ok, fail) => {
			new XMLReader ({xs})
				.on ('error', fail)
				.on ('close', ok)
				.process (xml)
		})

		expect (() => t (`<ns:client xmlns:ns="http://tempuri.org/"><ns:INVALID>x</ns:INVALID></ns:client>`)).rejects.toThrow (/^\[1:43\].*nexpected/)

		expect (() => t (`<ns:client xmlns:ns="http://tempuri.org/">\n<ns:INVALID>x</ns:INVALID>\n</ns:client>`)).rejects.toThrow (/^\[2:1\].*nexpected/)

	})

})

describe ('substitutionGroup', () => {

	const xs = new XMLSchemata (Path.join (__dirname, '..', '__data__', 'gml_FeatureCollection.xsd'))

	test ('concrete element accepted where abstract expected', () => {

		new XMLParser ({xs}).process ([
			`<gml:FeatureCollection xmlns:gml="http://www.opengis.net/gml/3.2">`,
			`<gml:featureMember>`,
			`<gml:ElectricLine>`,
			`<gml:GLOBALID>test</gml:GLOBALID>`,
			`</gml:ElectricLine>`,
			`</gml:featureMember>`,
			`</gml:FeatureCollection>`,
		].join (''))

	})

	test ('element without substitutionGroup rejected', () => {

		expect (() => new XMLParser ({xs}).process ([
			`<gml:FeatureCollection xmlns:gml="http://www.opengis.net/gml/3.2">`,
			`<gml:featureMember>`,
			`<gml:FeatureCollection>`, // exists in schema but has no substitutionGroup
			`</gml:FeatureCollection>`,
			`</gml:featureMember>`,
			`</gml:FeatureCollection>`,
		].join (''))).toThrow ('nexpected')

	})

	test ('unknown element rejected', () => {

		expect (() => new XMLParser ({xs}).process ([
			`<gml:FeatureCollection xmlns:gml="http://www.opengis.net/gml/3.2">`,
			`<gml:featureMember>`,
			`<gml:NoSuchElement>`,
			`</gml:NoSuchElement>`,
			`</gml:featureMember>`,
			`</gml:FeatureCollection>`,
		].join (''))).toThrow ('nexpected')

	})

})

describe ('gml:id attribute ref', () => {

	const xs = new XMLSchemata (Path.join (__dirname, '..', '__data__', 'gml_id.xsd'))

	test ('gml:id accepted on FunctionalZone', () => {

		new XMLParser ({xs}).process ([
			`<gml:FunctionalZone xmlns:gml="http://www.opengis.net/gml/3.2"`,
			` gml:id="FunctionalZone.0">`,
			`<gml:GLOBALID>8b2457c9-85c4-466a-a14b-b20856527718</gml:GLOBALID>`,
			`</gml:FunctionalZone>`,
		].join (''))

	})

	test ('bare id rejected (namespace required)', () => {

		expect (() => new XMLParser ({xs}).process ([
			`<gml:FunctionalZone xmlns:gml="http://www.opengis.net/gml/3.2"`,
			` id="FunctionalZone.0">`,
			`<gml:GLOBALID>8b2457c9-85c4-466a-a14b-b20856527718</gml:GLOBALID>`,
			`</gml:FunctionalZone>`,
		].join (''))).toThrow ('Unknown attribute')

	})

	test ('wrong namespace rejected', () => {

		expect (() => new XMLParser ({xs}).process ([
			`<gml:FunctionalZone xmlns:gml="http://www.opengis.net/gml/3.2"`,
			` xmlns:other="http://other.ns"`,
			` other:id="FunctionalZone.0">`,
			`<gml:GLOBALID>8b2457c9-85c4-466a-a14b-b20856527718</gml:GLOBALID>`,
			`</gml:FunctionalZone>`,
		].join (''))).toThrow ('Unknown attribute')

	})

})
