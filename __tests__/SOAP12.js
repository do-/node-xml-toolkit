const {SOAP12} = require ('../')

test ('basic', () => {

	const soap12 = new SOAP12 ('__data__/20186.wsdl')
	
	const d = {"GetForm9Sync":{"person":{"LastName":"ИВАНОВА","FirstName":"ПЕТР","SecondName":null,"BirthDate":"1970-11-11"},"address":{"Region":{"Code":"78","Name":"Санкт-Петербург"},"Street":{"Code":6597,"Name":"Московский пр-кт"},"House":"д. 18 литера Е","Flat":"33"}}}

	{

		const s = soap12.http (d, '<a/>')

		expect (s.method).toBe ('POST')
	
		expect (s.headers).toStrictEqual ({
			'Content-Type': 'application/soap+xml; charset=utf-8',
		})
	
		expect (s.body).toMatch (':Header><a/></')
	
	}

	{

		const s = soap12.http ([d])

		expect (s.method).toBe ('POST')
	
		expect (s.headers).toStrictEqual ({
			'Content-Type': 'application/soap+xml; charset=utf-8',
		})
		
	}

})
