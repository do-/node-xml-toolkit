const fs = require ('fs')
const {XMLParser} = require ('../')

test ('source', () => {

	const p = new XMLParser ({stripSpace: false})
	let src = fs.readFileSync ('__data__/schemas.xmlsoap.org.xml', 'utf-8')
	const d = p.process (src)

	src = src.replace (/<\?.*?\?>/gsm, '')
	src = src.replace (/<!--.*?-->/gsm, '')

	expect (String (d).trim ()).toBe (src.trim ())
	
})

test ('indent', () => {

	const p = new XMLParser ()
	const src = fs.readFileSync ('__data__/schemas.xmlsoap.org.xml', 'utf-8')
	const d = p.process (src)
	const last = d.children [d.children.length - 1]
	const s = last.toString ({space: 2, EOL: '\r\n'}, 1)

	expect (s.trimStart ()).toBe (src.slice (5966, -16))
	
})

test ('no indent', () => {

	const p = new XMLParser ()
	const src = fs.readFileSync ('__data__/schemas.xmlsoap.org.xml', 'utf-8')
	const d = p.process (src)
	const last = d.children [d.children.length - 1].children [0]
	const s = last.toString ({})

	expect (s).toBe ('<xs:sequence><xs:any namespace="##any" minOccurs="0" maxOccurs="unbounded" processContents="lax" /></xs:sequence>')

	const last1 = d.children [d.children.length - 2].children [0]

	expect (last1.toString ({space: '\t'})).toMatch ('<xs:documentation>Fault reporting structure</xs:documentation>')

})

test ('line breaks', () => {

	const p = new XMLParser ()
	const d = p.process (`<outer><inner id='"1"'>
  Line1
<![CDATA[<<EOF]]>
Line2
</inner></outer>`)

	expect (d.toString ({space: ' '})).toMatch ('<inner id="&quot;1&quot;">Line1&#xA;&lt;&lt;EOF&#xA;Line2</inner>')

})

test ('attr', () => {

	const p = new XMLParser ()
	const src = fs.readFileSync ('__data__/schemas.xmlsoap.org.xml', 'utf-8')
	const d = p.process (src)
	const s = d.toString ({space: 2, attrSpace: '\t'})

	expect (s.split ('\n')).toHaveLength (162)
	
})
