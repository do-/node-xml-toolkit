const fs = require ('fs')
const {XMLLexer, SAXEvent} = require ('../')

async function lex (fn, options = {}) {

	const xml = fs.readFileSync (`__data__/${fn}.xml`, 'utf-8')
	
	const lexer = new XMLLexer (options)

	return new Promise ((ok, fail) => {

		const a = []

		lexer.on ('error', fail)
		lexer.on ('end', () => ok (a))
		lexer.on ('data', data => {	
			const e = new SAXEvent (data)
			if (e.src.trim () !== '') a.push (e.type)	
		})

		lexer.end (xml)
	
	}) 

		
}

test ('E05a', async () => {

	expect (await lex ('E05a')).toStrictEqual ([
        'Comment',
        'DTD',
        'StartElement',
        'Characters',
        'CDATA',
        'Characters',
        'EndElement',
    ])

})

test ('not-sa01', async () => {

	expect (await lex ('not-sa01')).toStrictEqual ([
        'StartDocument',
        'DTD',
        'StartElement',
        'StartElement',
        'Characters',
        'EndElement',
        'EndElement',
    ])

})

test ('not-sa02', async () => {

	expect (await lex ('not-sa02')).toStrictEqual ([
		"StartDocument",
		"DTD",
		"Comment",
		"Comment",
		"StartElement",		
    ])

})

test ('param_types', async () => {

	expect (await lex ('param_types')).toStrictEqual ([
		"StartDocument",
		"StartElement",
		"StartElement",
		"StartElement",
		"StartElement",
		"StartElement",
		"StartElement",
		"StartElement",
		"StartElement",
		"StartElement",
		"StartElement",
		"StartElement",
		"StartElement",
		"StartElement",
		"StartElement",
		"StartElement",
		"StartElement",
		"EndElement",
    ])

})
/*
test ('overflow', async () => {

	await lex ('not-sa02', {maxLength: 1})

})*/