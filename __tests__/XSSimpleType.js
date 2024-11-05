const fs = require ('fs')
const {XSSimpleType, XMLParser, XSSimpleTypeFloat, XSSimpleTypeBoolean, XSSimpleTypeDate, XSSimpleTypeDateTime, XSSimpleTypeQName, XMLSchemata, XMLSchema} = require ('../')
const { XSSimpleTypeInteger } = require('../lib/XSSimpleType')

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

	const o = {}; o.o = o

	expect (() => t.stringify (o)).toThrow ()
	expect (() => t.stringify ()).toThrow ()
	expect (() => t.stringify (undefined)).toThrow ()
	expect (() => t.stringify (null)).toThrow ()
	expect (t.stringify (3.14)).toBe ('3.14')
	expect (t.stringify (-0.7)).toBe ('-0.7')
	expect (t.stringify (Number.POSITIVE_INFINITY)).toBe ('INF')
	expect (t.stringify (Number.NEGATIVE_INFINITY)).toBe ('-INF')
	
})

test ('stringify boolean', () => {

	const xs = new XMLSchemata ('__data__/schemas.xmlsoap.org.xml')

	const booleanType = xs.getType (['boolean', XMLSchema.namespaceURI])._xsSimpleType		
	expect (booleanType).toBeInstanceOf (XSSimpleTypeBoolean)

	const mustUnderstandType = xs.getAttributeSimpleType (xs.get ('http://schemas.xmlsoap.org/soap/envelope/').get ('mustUnderstand'))		
	expect (mustUnderstandType).toBeInstanceOf (XSSimpleTypeBoolean)

	const t = new XSSimpleTypeBoolean ()

	expect (() => t.stringify ()).toThrow ()
	expect (() => t.stringify (undefined)).toThrow ()
	expect (() => t.stringify ('frue')).toThrow ()
	expect (() => t.stringify (null)).toThrow ()
	expect (() => t.stringify (2)).toThrow ()
	expect (t.stringify (true)).toBe ('true')
	expect (t.stringify (false)).toBe ('false')
	
	expect (booleanType.stringify (true)).toBe ('true')
	expect (booleanType.stringify (false)).toBe ('false')
	expect (booleanType.stringify ('1')).toBe ('true')
	expect (booleanType.stringify (1)).toBe ('true')
	expect (booleanType.stringify (0)).toBe ('false')

	expect (mustUnderstandType.stringify (true)).toBe ('1')
	expect (mustUnderstandType.stringify (false)).toBe ('0')
	expect (mustUnderstandType.stringify (1)).toBe ('1')
	expect (mustUnderstandType.stringify (0)).toBe ('0')

})

test ('stringify date', () => {

	const xs = new XMLSchemata ('__data__/att.xsd')
	const att = xs.get ('http://tempuri.org/').get ('GetStatus').children[0].children[1]
	const dateType = xs.getAttributeSimpleType (att)

	expect (dateType).toBeInstanceOf (XSSimpleTypeDate)
	
	expect (dateType.stringify (0)).toBe ('1970-01-01')
	expect (dateType.stringify ('1970-01-01')).toBe ('1970-01-01')	
	expect (dateType.stringify ('1970-01-01T00:00:00')).toBe ('1970-01-01')

	expect ([...dateType.strings ('1970-01-01Z00:00')]).toStrictEqual (['1970-01-01Z00:00', '1970-01-01'])

})

test ('stringify datetime', () => {

	const dt = new XSSimpleTypeDateTime ()

	expect ([...dt.strings ('1970-01-01T00:00:00')]).toStrictEqual (['1970-01-01T00:00:00'])
	expect ([...dt.strings ('1970-01-01T00:00:00Z00:00')]).toStrictEqual (['1970-01-01T00:00:00Z00:00', '1970-01-01T00:00:00'])

})

test ('stringify qname', () => {

	const xs = new XMLSchemata ('__data__/att.xsd')

	const att = xs.get ('http://tempuri.org/').get ('GetStatus').children[0].children[0].children.at (-2)

	const q = xs.getAttributeSimpleType (att)

	expect (q).toBeInstanceOf (XSSimpleTypeQName)

	expect (() => q.stringify ({})).toThrow ()

	expect (q.stringify ({localName: 'any'})).toBe ('any')
	expect (q.stringify ({localName: 'any', namespaceURI: XMLSchema.namespaceURI})).toBe ('xs:any')

	expect (() => q.stringify ({})).toThrow ()
	
})


test ('stringify long', () => {

	const xs = new XMLSchemata ('__data__/att.xsd')

	const att = xs.get ('http://tempuri.org/').get ('GetStatus').children[0].children[0].children [5]

	const long = xs.getAttributeSimpleType (att)

	expect (long).toBeInstanceOf (XSSimpleTypeInteger)

	expect (() => long.stringify (Symbol ())).toThrow ()

})

test ('restrict pattern', () => {

	const p = new XMLParser ()
	const d = p.process (fs.readFileSync ('__data__/schemas.xmlsoap.org.xml', 'utf-8'))

	const t = new (new XSSimpleType ().restrict (d.children [6].children [0].children [0].children.map (({localName, attributes}) => ({name: localName, value: attributes.get ('value')})))) ()

	expect (t.test ('1')).toBe (true)
	expect (t.test ('true')).toBe (false)
	
})

test ('restrict fractionDigits', () => {

	const p = new XMLParser ()
	const d = p.process (fs.readFileSync ('__data__/att.xsd', 'utf-8'))

	const t = new (new XSSimpleType ().restrict (
		d.children [0].children [0].children [0].children.at (-1).children [0].children [0].children.map (({localName, attributes}) => ({name: localName, value: attributes.get ('value')})))
	) ()

	expect (t.fractionDigits).toBe (2)

})

test ('built in', () => {

	const xs = new XMLSchemata ('__data__/att.xsd')

	const xsb = xs.get (XMLSchema.namespaceURI)
	
	for (const i of xsb._src.children) {

		expect (new (xsb.getSimpleTypeClass (i)) ()).toBeInstanceOf (XSSimpleType)
		
	}

})
