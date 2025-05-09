const fs = require ('fs')
const {XMLParser, XMLNode} = require ('../')

test ('bad', () => {

	const p = new XMLParser ()

	expect (() => p.process ('<broken')).toThrow ('Unfinished')
	expect (() => p.process ('<broken                                                    ')).toThrow ('Unfinished')
	expect (() => p.process ('</broken>')).toThrow ('Unbalanced')

})

test ('innerText', () => {

	const p = new XMLParser ()

	{

		const d = p.process ('<root>Before<si>a<t/>n<![CDATA[d]]></si>after</root>')

		delete d.children [0].children

		expect (d.innerText).toBe ('Beforeandafter')

	}

	{

		const d = p.process ('<c r="E2" s="3" t="inlineStr"></c>')

		expect (d.innerText).toBe ('')

	}

})

test ('param_types', () => {

	const p = new XMLParser ({useEntities: false, useNamespaces: false})

	const d = p.process (fs.readFileSync ('__data__/param_types.xml', 'utf-8'))

	expect (d.children [0].xml).toBe ('')

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