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