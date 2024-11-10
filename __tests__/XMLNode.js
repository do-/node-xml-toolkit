const {XMLNode} = require ('../')

test ('type', () => {

	expect (new XMLNode ('<!?>').type).toBeNull ()
	expect (new XMLNode ('<?procezz?>').type).toBe (XMLNode.TYPES.PROCESSING_INSTRUCTION)
	expect (new XMLNode ('<a>').type).toBe (XMLNode.TYPES.START_ELEMENT)
	expect (new XMLNode ('</a>').type).toBe (XMLNode.TYPES.END_ELEMENT)

})

test ('xml', () => {

	expect (new XMLNode ('A').xml).toBe ('A')
//	expect (new XMLNode ('<a />').xml).toBe ('')
	expect (new XMLNode ('</a>').xml).toBe ('</a>')

})

test ('basic', () => {

	expect (Object.fromEntries (new XMLNode ('<a href="#">').attributes.entries ())).toStrictEqual ({href: '#'})

	{

		const e = new XMLNode ('AAA')

		expect (e.isCharacters).toBe (true)
		expect (e.isEndElement).toBe (false)

		e.findAfterName (0)
		expect (e._afterName).toBe (2)

	}

	{

		const e = new XMLNode ('</a>')

		expect (e.isCharacters).toBe (false)
		expect (e.isEndElement).toBe (true)

	}


})

test ('merge', () => {

	const n = new XMLNode ('</a>')

	n.children.push (new XMLNode ('1'))
	n.children.push (new XMLNode ('2'))

	expect (n.detach ().children).toStrictEqual (['12'])
	
})
