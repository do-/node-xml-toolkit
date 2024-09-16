const fs = require ('fs')
const {XMLParser, SOAPEncoding} = require ('../')

test ('basic', () => {

	const p = new XMLParser ()
	
	const d = p.process (fs.readFileSync ('__data__/soapenc.xml', 'utf-8')).children [1].children [0].children [0]

	{
		const se = new SOAPEncoding ()
		const o = se.decode (d)
		expect ('house_block' in o).toBe (false)
		expect (o.capital_repairs[0].work_list).toStrictEqual (['21'])
	}

	{
		const se = new SOAPEncoding ({emptyScalar: null})
		const o = se.decode (d)
		expect (o.house_block).toBeNull ()
		expect (o.capital_repairs[0].work_list).toStrictEqual (['21'])
	}

})