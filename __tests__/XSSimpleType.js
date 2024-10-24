const fs = require ('fs')
const {XSSimpleType, XMLParser, XSSimpleTypeFloat} = require ('../')

test ('stringify', () => {

	const t = new XSSimpleType ()

	expect (() => t.stringify ()).toThrow ()
	expect (() => t.stringify (undefined)).toThrow ()
	expect (() => t.stringify (null)).toThrow ()
	expect (t.stringify ('')).toBe ('')
	expect (t.stringify (1)).toBe ('1')
	
})

test ('stringify float', () => {

	const t = new XSSimpleTypeFloat ()

	expect (() => t.stringify ()).toThrow ()
	expect (() => t.stringify (undefined)).toThrow ()
	expect (() => t.stringify (null)).toThrow ()
	expect (t.stringify (3.14)).toBe ('3.14')
	expect (t.stringify (-0.7)).toBe ('-0.7')
	expect (t.stringify (Number.POSITIVE_INFINITY)).toBe ('INF')
	expect (t.stringify (Number.NEGATIVE_INFINITY)).toBe ('-INF')
	
})

test ('restrict pattern', () => {

	const p = new XMLParser ()
	const d = p.process (fs.readFileSync ('__data__/schemas.xmlsoap.org.xml', 'utf-8'))

	const t = new (new XSSimpleType ().restrict (d.children [6].children [0].children [0].children.map (({localName, attributes}) => ({name: localName, value: attributes.get ('value')})))) ()

	expect (t.test ('1')).toBe (true)
	expect (t.test ('true')).toBe (false)

//console.log (d.children [6].children [0].children [0])	
	
})

test ('restrict fractionDigits', () => {

	const p = new XMLParser ()
	const d = p.process (fs.readFileSync ('__data__/att.xsd', 'utf-8'))

	const t = new (new XSSimpleType ().restrict (
		d.children [0].children [0].children [0].children.at (-1).children [0].children [0].children.map (({localName, attributes}) => ({name: localName, value: attributes.get ('value')})))
	) ()

	expect (t.fractionDigits).toBe (2)

//console.log (d.children [0].children [0].children [0].children.at (-1).children [0].children [0])

})