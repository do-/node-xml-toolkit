const {XMLPrinter} = require ('../')

test ('constructor', () => {

	expect (new XMLPrinter ().space).toBe ('')
	expect (new XMLPrinter ({space: 2}).space).toBe ('  ')
	expect (new XMLPrinter ({space: ' ', attrSpace: 1}).attrSpace).toBe (' ')

	expect (() => new XMLPrinter ({level: -1})).toThrow ()
	expect (() => new XMLPrinter ({space: -1})).toThrow ()
	expect (() => new XMLPrinter ({attrSpace: 1})).toThrow ()
	expect (() => new XMLPrinter ({space: ' ', attrSpace: -1})).toThrow ()
	expect (() => new XMLPrinter ({space: ' ', EOL: 1})).toThrow ()

	expect (new XMLPrinter ().ESC_BODY.escape ('\r\n')).toBe ('&#xD;&#xA;')
	expect (new XMLPrinter ({encodeLineBreaks: false}).ESC_BODY.escape ('\r\n')).toBe ('\r\n')

})

test ('bad', () => {

	expect (() => new XMLPrinter ().writeCharacters (' ')).toThrow ()
	expect (() => new XMLPrinter ().writeAttribute ('id', '1')).toThrow ()

	{
		const xp = new XMLPrinter ()
		xp.openElement ('outer')
		expect (() => xp.writeCharacters (1)).toThrow ()
	}

	{
		const xp = new XMLPrinter ()
		xp.openElement ('outer')
		expect (() => xp.writeAttribute ('id', 1)).toThrow ()
	}

	{
		const xp = new XMLPrinter ()
		xp.openElement ('outer')
		expect (() => xp.writeAttribute (1, 'id')).toThrow ()
	}

})

test ('self enclosing', () => {

	expect (new XMLPrinter ().openElement ('outer').writeCharacters ('').closeElement ().text).toBe ('<outer />')

})

test ('text', () => {

	const xp = new XMLPrinter ()
	xp.openElement ('outer')
	xp.writeCharacters ('a')
	xp.writeCharacters ('b')
	xp.closeElement ()

	expect (xp.text).toBe ('<outer>ab</outer>')

})

test ('basic', () => {

	const xp = new XMLPrinter ()
	xp.openElement ('outer')
		xp.writeAttribute ('id', '1')
		xp.openElement ('inner')
			xp.writeCharacters ('txt')
		xp.closeElement ()
		xp.openElement ('leaf')
		xp.closeElement ()
	xp.closeElement ()

	expect (xp.text).toBe ('<outer id="1"><inner>txt</inner><leaf /></outer>')

})

test ('indent', () => {

	const xp = new XMLPrinter ({space: 2, EOL: '\n'})
	xp.openElement ('outer')
		xp.writeAttribute ('id', '1')
		xp.openElement ('inner')
			xp.writeCharacters ('txt')
		xp.closeElement ()
		xp.openElement ('leaf')
		xp.closeElement ()
	xp.closeElement ()

	expect (xp.text).toBe (`<outer id="1">
  <inner>txt</inner>
  <leaf />
</outer>`)

})

test ('indent attr', () => {

	const xp = new XMLPrinter ({space: 2, attrSpace: 1, EOL: '\n'})
	xp.openElement ('outer')
		xp.writeAttribute ('id', '1')
		xp.openElement ('inner')
			xp.writeAttribute ('id', '2')
			xp.writeCharacters ('txt')
		xp.closeElement ()
		xp.openElement ('inner2')
			xp.writeCharacters ('xtx')
		xp.closeElement ()
		xp.openElement ('inner3')
			xp.writeAttribute ('id', '3')
		xp.closeElement ()
		xp.openElement ('leaf')
		xp.closeElement ()
	xp.closeElement ()

	expect (xp.text).toBe (`
<outer
 id="1"
>
  <inner
   id="2"
  >txt</inner>
  <inner2>xtx</inner2>
  <inner3
   id="3"
   />
  <leaf />
</outer>`.trim ())

})

test ('decl', () => {

	expect (new XMLPrinter ().writeXMLDecl ().text).toBe ('<?xml version="1.0"?>')
	expect (new XMLPrinter ().writeXMLDecl ({encoding: 'utf-8'}).text).toBe ('<?xml version="1.0" encoding="utf-8"?>')
	expect (new XMLPrinter ().writeXMLDecl ({standalone: true}).text).toBe ('<?xml version="1.0" standalone="yes"?>')
	expect (new XMLPrinter ().writeXMLDecl ({encoding: 'ascii', standalone: 0}).text).toBe ('<?xml version="1.0" encoding="ascii" standalone="no"?>')

	expect (() => new XMLPrinter ().openElement ('outer').writeXMLDecl ()).toThrow ()

	const xp = (new XMLPrinter ({
		decl: {encoding: 'utf-8'}, 
		space: 1, 
		EOL: '\n'
	}))

	expect (xp.openElement ('root').closeElement ().text).toBe ('<?xml version="1.0" encoding="utf-8"?>\n<root />')
	expect (xp.reset ().openElement ('leaf').closeElement ().text).toBe ('<?xml version="1.0" encoding="utf-8"?>\n<leaf />')

})