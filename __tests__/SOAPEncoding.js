const fs = require ('fs')
const {XMLParser, SOAPEncoding} = require ('../')

test ('bad', () => {

	expect (() => new SOAPEncoding ().decode (new XMLParser ().process ('<a xsi:type="xml:id" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" />'))).toThrow ('how to')
	expect (() => new SOAPEncoding ().decode (new XMLParser ().process ('<a xsii:type="xml:id" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" />'))).toThrow ('xsi:type')
	expect (() => new SOAPEncoding ().decode (new XMLParser ().process ('<a xsi:type="SOAP-ENC:id" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" />'))).toThrow ('how to')
	expect (() => new SOAPEncoding ().decode (new XMLParser ().process ('<a xsi:type="ns2:id" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ns2="http://xml.apache.org/xml-soap" />'))).toThrow ('how to')
 
})

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