const fs = require ('fs')
const {XMLParser, XMLNode} = require ('../')

test ('param_types', () => {

	const p = new XMLParser ()

	const d = p.process (fs.readFileSync ('__data__/param_types.xml', 'utf-8'))

	const [o] = XMLNode.toObject ({map: _ => [_]}) (d)

	expect (o.PARAMTYPE).toHaveLength (15)

})

test ('basic', () => {

	const p = new XMLParser ()
	const d = p.process (fs.readFileSync ('__data__/amp.xml', 'utf-8'))

	expect (XMLNode.toObject () (d)).toStrictEqual ({
		count: '1',
		uniqueCount: '1',
		xmlnsxmlns: "ok",
		si: {
			t: 'MASS PROPERTIES for POST&DSENDS, NOMINAL and DISPERSED'
		},
	})

	{

		const {_nsMap} = d.attributes

		expect (_nsMap.getNamespaceURI ('0:0')).toBeNull ()

		expect ([..._nsMap.getQNames ('id', 'http://www.w3.org/XML/1998/namespace')]).toStrictEqual (['xml:id'])
		expect ([..._nsMap.getQNames ('id', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')]).toStrictEqual (['id'])

	}
	
})