const fs = require ('fs')
const assert = require ('assert')
const {XMLLexer} = require ('../')

async function test_001_lexer_sync (fn) {

	const xml = fs.readFileSync ('test/' + fn, 'utf-8')
	
console.log (xml)

	const lexer = new XMLLexer ()

	lexer.on ('data', data => console.log ({data}))

	lexer.end (xml)

}

async function main () {

	await test_001_lexer_sync ('E05a.xml')

}

main ()
