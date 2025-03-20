const {SOAP11} = require ('../')

test ('basic', () => {

	const soap11 = new SOAP11 ('__data__/20186.wsdl')
	
	const d = {"GetForm9Sync":{"person":{"LastName":"ИВАНОВА","FirstName":"ПЕТР","SecondName":null,"BirthDate":"1970-11-11"},"address":{"Region":{"Code":"78","Name":"Санкт-Петербург"},"Street":{"Code":6597,"Name":"Московский пр-кт"},"House":"д. 18 литера Е","Flat":"33"}}}

	const s = soap11.http (d, '<a/>')

	expect (s.method).toBe ('POST')

	expect (s.headers).toStrictEqual ({
		'Content-Type': 'text/xml; charset=utf-8',
		SOAPAction: 'http://tempuri.org/IF9Service/GetForm9Sync'
	})

	expect (s.body).toMatch (':Header><a/></')

})

test ('legacy', async () => {

	const soap11 = await SOAP11.fromFile ('__data__/20186.wsdl')
	
	const d = {"GetForm9Sync":{"person":{"LastName":"ИВАНОВА","FirstName":"ПЕТР","SecondName":null,"BirthDate":"1970-11-11"},"address":{"Region":{"Code":"78","Name":"Санкт-Петербург"},"Street":{"Code":6597,"Name":"Московский пр-кт"},"House":"д. 18 литера Е","Flat":"33"}}}

	const s = soap11.http ([d])

	expect (s.method).toBe ('POST')

	expect (s.headers).toStrictEqual ({
		'Content-Type': 'text/xml; charset=utf-8',
		SOAPAction: 'http://tempuri.org/IF9Service/GetForm9Sync'
	})

})

test ('no binding', async () => {

	const soap11 = await SOAP11.fromFile ('__data__/20184.wsdl')

	const person  = {"LastName":"ИВАНОВА","FirstName":"ПЕТР","SecondName":null,"BirthDate":"1970-11-11"}
	const address = {"Region":{"Code":"78","Name":"Санкт-Петербург"},"Street":{"Code":6597,"Name":"Московский пр-кт"},"House":"д. 18 литера Е","Flat":"33"}

	{
	
		const d = {GetForm7Async:{person, address}}

		const s = soap11.http ([d])

		expect (s.method).toBe ('POST')

		expect (s.headers).toStrictEqual ({
			'Content-Type': 'text/xml; charset=utf-8',
			SOAPAction: 'http://tempuri.org/IF7Service/GetForm7Async'
		})

	}

	{
	
		const d = {GetForm7AsyncResponse:{person, address}}

		const s = soap11.http ([d])

		expect (s.method).toBe ('POST')

		expect (s.headers).toStrictEqual ({
			'Content-Type': 'text/xml; charset=utf-8',
			SOAPAction: ''
		})

	}

})