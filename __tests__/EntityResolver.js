const {EntityResolver} = require ('../')

test ('bad', () => {

	const er = new EntityResolver ()
	
	expect (() => er.fix ('Hello&nbsp;World')).toThrow ()
	expect (() => er.fix ('Hello&#?;World')).toThrow ()
	expect (() => er.fix ('Hello&#0;World')).toThrow ()
	expect (() => er.fix ('Hello&#32World')).toThrow ()

})

test ('basic', () => {

	const er = new EntityResolver ()
	
	expect (er.fix ('Spade')).toBe ('Spade')
	expect (er.fix ('&lt;a id=&apos;1&apos; href=&quot;#&quot;&gt;O&#32;K&#x0D;&#x0A;&lt;/a&gt;')).toBe (`<a id='1' href="#">O K\r\n</a>`)

	expect (er.body.get ('#32')).toBe (' ')
	expect (er.body.get ('#x0D').charCodeAt (0)).toBe (13)
	expect (er.body.get ('#x0A').charCodeAt (0)).toBe (10)

})