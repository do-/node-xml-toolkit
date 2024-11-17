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

test ('overflow', async () => {

	async function t (maxLength) {

		const lexer = new XMLLexer ({maxLength})

		return new Promise ((ok, fail) => {
	
			const a = []
	
			lexer.on ('error', fail)
			lexer.on ('end', () => ok (a))
			lexer.on ('data', data => {	
				const e = new SAXEvent (data)
				if (e.src.trim () !== '') a.push (e.type)	
			})
	
			lexer.write ('<a href="#"')
			lexer.end ('>')
		
		}) 	

	}

	await t (11)
	await expect (() => t (10)).rejects.toBeDefined ()

})

test ('x', async () => {

	const lexer = new XMLLexer ({encoding: 'utf8'})

	const a = await new Promise ((ok, fail) => {
	
		const a = []

		lexer.on ('error', fail)
		lexer.on ('end', () => ok (a))
		lexer.on ('data', data => {	
			const e = new SAXEvent (data)
			if (e.src.trim () !== '') a.push (e)	
		})

		lexer.write ('<!ENTITY')
		lexer.write (' internal " number99">')
		lexer.end ()

	})

	expect (a[0].type).toBeNull ()

})


test ('xx', async () => {

	const lexer = new XMLLexer ({encoding: 'utf8'})

	const a = await new Promise ((ok, fail) => {
	
		const a = []

		lexer.on ('error', fail)
		lexer.on ('end', () => ok (a))
		lexer.on ('data', data => {	
			const e = new SAXEvent (data)
			if (e.src.trim () !== '') a.push (e)	
		})

		lexer.write ('<')
		lexer.write (' ')
		lexer.write ('a/>')
		lexer.end ()

	})

	expect (a[0].type).toBe ('StartElement')

})


test ('xx', async () => {

	const lexer = new XMLLexer ({encoding: 'utf8'})

	const a = await new Promise ((ok, fail) => {
	
		const a = []

		lexer.on ('error', fail)
		lexer.on ('end', () => ok (a))
		lexer.on ('data', data => {	
			const e = new SAXEvent (data)
			if (e.src.trim () !== '') a.push (e)	
		})

		lexer.write ('<!')
		lexer.write (' ')
		lexer.write ('>')
		lexer.end ()

	})

	expect (a[0].type).toBeNull ()

})

test ('pi', async () => {

	const lexer = new XMLLexer ({encoding: 'utf8'})

	const a = await new Promise ((ok, fail) => {
	
		const a = []

		lexer.on ('error', fail)
		lexer.on ('end', () => ok (a))
		lexer.on ('data', data => {	
			const e = new SAXEvent (data)
			if (e.src.trim () !== '') a.push (e)	
		})

		lexer.write ('<?')
		lexer.write ('ProcessingInstruction')
		lexer.write ('>')
		lexer.end ()

	})

	expect (a[0].type).toBe ('StartDocument')

})

test ('isClosing', async () => {

	const lexer = new XMLLexer ()

	lexer.awaited = Buffer.from ('--', 'ascii')
	lexer.body = '++'
	lexer.start = 0

	expect (lexer.isClosing (0)).toBe (false)
	expect (lexer.isClosing (1)).toBe (false)

})
