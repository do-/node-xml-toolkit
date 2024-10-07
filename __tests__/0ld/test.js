const fs = require ('fs')
const assert = require ('assert')
const {XMLReader, SAXEvent, XMLLexer, AttributesMap, XMLNode, XMLSchemata, SOAP11, SOAP12, EntityResolver, XMLIterator, XMLParser, SOAPFault, SOAP} = require ('../')

async function test_001_lexer_sync (fn) {

	const xml = fs.readFileSync (
		'test/' + fn
//		, 'utf-8'
	)
	
console.log (xml)

	const lexer = new XMLLexer ({
//		maxLength: 40,
//		encoding: 'ascii',
	})
	

	lexer.on ('data', data => {
	
		const e = new SAXEvent (data)

		console.log ([e, e.type])	

	})
	
//	for (let c of xml) lexer.write (c); lexer.end ()
//	for (let c of xml) lexer.write (Buffer.from ([c])); lexer.end ()

	lexer.end (xml)

}

async function test_002_lexer_stream (fn) {

	const is = fs.createReadStream ('test/' + fn, {
//		encoding: 'utf8',
	})
	
	const lexer = new XMLLexer ({
//		maxLength: 40,
//		encoding: 'ascii',
	})

	is.pipe (lexer)
	
	for await (const i of lexer) 
//	if (/^<PARAMTYPE /.test (i)) 
	{
		console.log ({i})
	
	}

}


async function test_003_emitter_sync (fn) {

	const xml = fs.readFileSync (
		'test/' + fn
		, 'utf-8'
	)
	
console.log (xml)

	const sax = new XMLReader ({
//		stripSpace: true,
//		filterElements: 'root',		
//		filterElements: 'PARAMTYPES'
		filterElements: 'SendRequestRequest',
		map: n => n.detach ({nsMap: true}),
//		map: XMLNode.toObject ({
//			wrap: 1,
//			getName: (localName, namespaceURI) => (!namespaceURI ? '' : '{' + namespaceURI + '}') + localName,
//			map: o => Object.fromEntries (Object.entries (o).map (([k, v]) => [k + '111', v]))
//		})
	})

/*
	for (let event of [
		'data',
		'close',
		'end',
		'finish',
//		'EndElement',
	]) sax.on (event, data => {
			
		console.log ([JSON.stringify (data, null, 2), event])
	
	})
*/

		
//console.log (sax)
//console.log (sax.isSAX)

/*
	let s = ''
	for await (const e of sax) {
		s += xml
//		console.log ([e.type, e.isStartElement, e.isEndElement , e.isCharacters])
	}
*/
//console.log ([xml, s])

	const v = await sax.process (xml).findFirst ()

	console.log (JSON.stringify (v, null, 2))

}

async function test_005_schemata (fn) {

	const xs = await XMLSchemata.fromFile ('test/20040.wsdl')
	const xss = new XMLSchemata ('test/20040.wsdl')
	
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
	
//	const m = xs.createMarshaller ('AppDataChildDotation', 'http://smev.gosuslugi.ru/rev111111')

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

	console.log (xs.stringify (d))
	console.log (xss.stringify (d))

}

function test_007_wsdl (fn) {

	const soap11 = new SOAP11 ('test/20186.wsdl')
	const soap12 = new SOAP12 ('test/20186.wsdl')
	
	const d = {"GetForm9Sync":{"person":{"LastName":"ИВАНОВА","FirstName":"ПЕТР","SecondName":null,"BirthDate":"1970-11-11"},"address":{"Region":{"Code":"78","Name":"Санкт-Петербург"},"Street":{"Code":6597,"Name":"Московский пр-кт"},"House":"д. 18 литера Е","Flat":"33"}}}

	console.log (soap11.http (d))
	console.log (soap12.http (d))

}

async function test_009_schemata (fn) {

	const xs = new XMLSchemata ('test/' + fn)

//	console.log (xs)

//	console.log (xs.stringify ({AckResponse: null}))

/*
	const data = {
		AckRequest: {
//			AckTargetMessage: {Id: 1, accepted: true, null: 2},
			AckTargetMessage: 11111,
		}
	}
*/

	const data = {GetResponseRequest: {

			MessageTypeSelector: {
				Id: 1, 
				Timestamp: new Date ()//.toJSON ()
			}

		}}


	console.log (xs.stringify (data))

}

function test_010_node () {

	for (const s of 
		[
			'<a />zzz',
			'zzz<b>',
			'<!-- 111 -->222',
			'<![CDATA[ >>]>>]]>zzz',
			'<?xml version="3.11"?><a/>',
		]
	) {
	
		let n = new XMLNode (s)
		
		n.trim ()
		
		console.log (n)		
	
	}

}

function test_011_iterator (fn) {

	const xml = fs.readFileSync (
		'test/' + fn
		, 'utf-8'
	)
	
console.log (xml)

	for (const i of new XMLIterator (xml)) {

console.log ([i, i.detach ()])

	}

}

function test_012_parser (fn) {

	const xml = fs.readFileSync (
		'test/' + fn
		, 'utf-8'
	)
	
//console.log (new XMLParser ().process (xml).detach ())

const parser = new XMLParser  ({})
const doc = parser.process (xml)

for (const element of doc.children) {
  console.log (element)
}

}

function test_013_soap () {

	const xs11 = new XMLSchemata ('lib/soap-1.1.xsd')

	const detail = `
		<PO:order xmlns:PO="http://gizmos.com/orders/">Quantity element does not have a value</PO:order>
		<PO:confirmation xmlns:PO="http://gizmos.com/confirm">Incomplete address: no zip code</PO:confirmation>
	`	
	
	const f = 
			new SOAPFault ('Message does not have necessary info', {
				code: 'Client',
				actor: 'http://gizmos.com/order',
				detail
			})
	
	console.log (SOAP (1.1).message (f, '', {declaration: {}}))
//	console.log (SOAP (1.2).message (f))

}


async function main () {

//	await test_001_lexer_sync ('E05a.xml')
//await test_001_lexer_sync ('not-sa01.xml')
//	await test_001_lexer_sync ('not-sa02.xml')
//	await test_001_lexer_sync ('param_types.xml')
//	await test_002_lexer_stream ('E05a.xml')
//	await test_002_lexer_stream ('param_types.xml')
//	await test_002_lexer_stream ('not-sa02.xml')
//	await test_003_emitter_sync ('E05a.xml')
//	await test_003_emitter_sync ('param_types.xml')
//	await test_003_emitter_sync ('not-sa01.xml')
// 	await test_003_emitter_sync ('ent.xml')
//	await test_003_emitter_sync ('soap.xml')
//	await test_005_schemata ()
//	test_007_wsdl ()
	
	test_009_schemata ('smev-message-exchange-service-1.1.xsd')
//	test_009_schemata ('sign.xsd')

//	test_010_node ()
//	test_011_iterator ('param_types.xml')
//	test_011_iterator ('20040.wsdl')

//	test_012_parser ('param_types.xml')
//	test_012_parser ('20040.wsdl')

//test_013_soap ()
	
}

main ()
