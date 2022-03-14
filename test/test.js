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

	let xs = await XMLSchemata.fromFile ('test/dom-gosuslugi-ru-smev3-debt-responses.xsd')
/*		
	const localName = 'ImportDebtRequestsRequest'
	
	const s = xs.getSchemaByLocalName (localName)
	
	const o = s.get (localName)
	
	const nspm = xs.getNamespacePrefixesMap (o)
*/	
	console.log (xs.stringify ({
  "ExportDebtRequestsResponse": {	
    "request-data": {
      "request-id": "bac4c940-6ad3-11eb-9439-0242ac130002",
      "request-number": "022021173",
      "applicant-info": {
        "firstname": "Иван",
        "lastname": "Иванов",
        "middlename": "Иванович",
        "snils": "11111111145",
        "document": {
          "type": "1",
          "series": "1234",
          "number": "123456"
        }
      },
      "housing-fund-object": {
        "house-id": "e786b770-28e6-4557-8dde-86e8e347587e",
        "address-details": "кв. 27",
        "fias-house-id": "497cdeef-0388-466b-a063-36f51d94800c",
        "address": "153045, Ивановская обл, г. Иваново, ул. 3 Июня, д. 14"
      },
      "period": {
        "start-date": "2018-02-01",
        "end-date": new Date ()
      },
      "organization": {
        "organization-root-id": "6eef689e-48bb-4eb0-9c11-18b6db9909b7",
        "name": "Администрация г. Иваново",
        "tel": "+7(4932)32-80-83"
      },
      "executor-info": {
        "id": "84b12e02-6ad8-11eb-9439-0242ac130002",
        "fio": "Четвертак Иван Иванович"
      },
      "status": "PROCESSED",
      "result": 4,
      "creation-date": "2021-02-04",
      "sent-date": "2021-02-04",
      "response-date": "2021-02-08",
      "subrequest": {
        "organization": {
          "organization-root-id": "ad50290c-6ad9-11eb-9439-0242ac130002",
          "name": "УК ООО \"ГУЖФ\"",
          "tel": "8-800-200-50-58"
        },
        "response": {
          "type": "PROVIDED",
          "has-debt": true,
          "debt-info": [
            {
              "person": {
                "firstname": "Петр",
                "lastname": "Петров",
                "middlename": "Петрович",
                "snils": "11111111146",
                "document": {
                  "type": "1",
                  "series": "1235",
                  "number": "123455"
                }
              }
            },
            {
              "person": {
                "firstname": "Сидор",
                "lastname": "Сидоров",
                "middlename": "Сидорович",
                "snils": "11111111146",
                "document": {
                  "type": "1",
                  "series": "1235",
                  "number": "123455"
                }
              }
            }
          ],
          "executor-info": {
            "id": "38a794b8-6ada-11eb-9439-0242ac130002",
            "fio": "Герасимова Ольга Ивановна"
          }
        }
      }
    }
  }
}))
	
	//getNamespacePrefixesMap
/*	
	console.log (xs.get ('urn:dom.gosuslugi.ru/debt-requests/1.0.0').get ('ImportDebtRequestsRequest').complexType.complexContent.extension)

	console.log (xs.get ('urn:dom.gosuslugi.ru/common/1.2.0').get ('BaseRequestType').sequence )

	console.log (xs.get ('urn:dom.gosuslugi.ru/debt-requests/1.0.0').get ('ActionType').restriction)
*/
 
}

async function test_005_schemata (fn) {

	const xs = await XMLSchemata.fromFile ('test/20040.wsdl')
	
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
	
	const m = xs.createMarshaller ('AppDataChildDotation', 'http://smev.gosuslugi.ru/rev111111')
		
	console.log (m.stringify ({info}))
 
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
//	await test_004_schemata ()
	await test_005_schemata ()

}

main ()
