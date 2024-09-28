const fs = require ('fs')
const {XMLParser, XMLNode} = require ('../')

test ('basic', () => {

	const p = new XMLParser ()
	const d = p.process (fs.readFileSync ('__data__/amp.xml', 'utf-8'))

	expect (XMLNode.toObject () (d)).toStrictEqual ({
		count: '1',
		uniqueCount: '1',
		si: {
			t: 'MASS PROPERTIES for POST&DSENDS, NOMINAL and DISPERSED'
		},
	})
	
})

test ('source', () => {

	const p = new XMLParser ({stripSpace: false})
	let src = fs.readFileSync ('__data__/schemas.xmlsoap.org.xml', 'utf-8')
	const d = p.process (src)

	src = src.replace (/<\?.*?\?>/gsm, '')
	src = src.replace (/<!--.*?-->/gsm, '')

	expect (String (d).trim ()).toBe (src.trim ())
	
})