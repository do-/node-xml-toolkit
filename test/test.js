const fs = require ('fs')
const assert = require ('assert')
const {XMLReader, SAXEvent, XMLLexer, AttributesMap, XMLNode, XMLSchemata} = require ('../')

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

	lexer.on ('data', data => console.log (new SAXEvent (data).attributes))
	
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
		filterElements: 'SendRequestRequest',
		map: XMLNode.toObject ({
//			wrap: 1,
			getName: (localName, namespaceURI) => (!namespaceURI ? '' : '{' + namespaceURI + '}') + localName,
			map: o => Object.fromEntries (Object.entries (o).map (([k, v]) => [k + '111', v]))
		})
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

async function test_004_schemata (fn) {

	let xs = await XMLSchemata.fromFile ('test/dom-gosuslugi-ru-smev3-debt-requests.xsd')
/*		
	const localName = 'ImportDebtRequestsRequest'
	
	const s = xs.getSchemaByLocalName (localName)
	
	const o = s.get (localName)
	
	const nspm = xs.getNamespacePrefixesMap (o)
*/	
	console.log (xs.stringify ({
	
   "ImportDebtRequestsRequest" : {
      "information-system-id" : "35a823b4-55da-4622-a561-6bae5c0a00ba",
      "organization-id" : "6eef689e-48bb-4eb0-9c11-18b6db9909b7",
      "action" : [ {
         "transport-id" : "be03eb8e-6f80-11eb-9439-0242ac130002",
         "action-type" : "SEND",
         "request-data" : {
            "applicant-info" : {
               "firstname" : "Иванов",
               "lastname" : "Иван",
               "middlename" : "Иванович",
               "snils" : "11111111145",
               "document" : {
                  "type" : 1,
                  "series" : "1234",
                  "number" : "123456"
               }
            },
            "housing-fund-object" : {
               "house-id" : "e786b770-28e6-4557-8dde-86e8e347587e",
               "address-details" : "кв. 27"
            },
            "executor-id" : "df82b6d8-66d8-11eb-ae93-0242ac130002"
         }
      } ]
   }
	
	}))
	
	//getNamespacePrefixesMap
/*	
	console.log (xs.get ('urn:dom.gosuslugi.ru/debt-requests/1.0.0').get ('ImportDebtRequestsRequest').complexType.complexContent.extension)

	console.log (xs.get ('urn:dom.gosuslugi.ru/common/1.2.0').get ('BaseRequestType').sequence )

	console.log (xs.get ('urn:dom.gosuslugi.ru/debt-requests/1.0.0').get ('ActionType').restriction)
*/
 
}

async function main () {

//	await test_001_lexer_sync ('E05a.xml')
//	await test_001_lexer_sync ('not-sa01.xml')
//	await test_001_lexer_sync ('not-sa02.xml')
//	await test_001_lexer_sync ('param_types.xml')
//	await test_002_lexer_stream ('E05a.xml')
//	await test_002_lexer_stream ('param_types.xml')
//	await test_002_lexer_stream ('not-sa02.xml')
//	await test_003_emitter_sync ('E05a.xml')
//	await test_003_emitter_sync ('param_types.xml')
//	await test_003_emitter_sync ('not-sa01.xml')
//	await test_003_emitter_sync ('ent.xml')
//	await test_003_emitter_sync ('soap.xml')
	await test_004_schemata ()

}

main ()
