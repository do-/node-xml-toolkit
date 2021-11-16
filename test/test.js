const fs = require ('fs')
const assert = require ('assert')
const {XMLLexer, Attributes} = require ('../')

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

	lexer.on ('data', data => console.log ({data}))
	
//	for (let c of xml) lexer.write (c); lexer.end ()
	for (let c of xml) lexer.write (Buffer.from ([c])); lexer.end ()

//	lexer.end (xml)

}

async function test_002_lexer_stream (fn) {

	const is = fs.createReadStream ('test/' + fn, {
//		encoding: 'utf8',
	})
	
	const lexer = new XMLLexer ({
//		maxLength: 40,
//		encoding: 'ascii',
	})

	lexer.on ('data', data => {
	
		let a = new Attributes (data)
		
		console.log (new Attributes (data).toObject ())
	
//	for (let kv of a) console.log (kv)
	
//		for (let [, k1, v1, k2, v2] of data.matchAll (/([^\s=]+)='([^']+)'|([^\s=]+)="([^"]+)"/g)) console.log ([k1 || k2, v1 || v2]) // "'
	}
//		console.log ({data})
	)
	
	return new Promise ((ok, fail) => {
		
		is.on ('error', fail)
		lexer.on ('error', fail)
		
		lexer.on ('end', ok)
		
		is.pipe (lexer)
		
	})

}

async function main () {

//	await test_001_lexer_sync ('E05a.xml')
//	await test_001_lexer_sync ('not-sa01.xml')
//	await test_001_lexer_sync ('not-sa02.xml')
//	await test_001_lexer_sync ('param_types.xml')
//	await test_001_lexer_sync ('E05a.xml')
	await test_002_lexer_stream ('param_types.xml')
//	await test_002_lexer_stream ('not-sa02.xml')

}

main ()
