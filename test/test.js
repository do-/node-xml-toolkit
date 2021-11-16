const fs = require ('fs')
const assert = require ('assert')
const {XMLLexer} = require ('../')

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

async function main () {

	await test_001_lexer_sync ('E05a.xml')
//	await test_001_lexer_sync ('not-sa01.xml')
//	await test_001_lexer_sync ('not-sa02.xml')

}

main ()
