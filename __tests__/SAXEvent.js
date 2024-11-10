const {SAXEvent} = require ('../')

test ('type', () => {

	expect (new SAXEvent ('<!?>').type).toBeNull ()
	expect (new SAXEvent ('<?procezz?>').type).toBe (SAXEvent.TYPES.PROCESSING_INSTRUCTION)
	expect (new SAXEvent ('<a>').type).toBe (SAXEvent.TYPES.START_ELEMENT)
	expect (new SAXEvent ('</a>').type).toBe (SAXEvent.TYPES.END_ELEMENT)

})

test ('basic', () => {

	expect (Object.fromEntries (new SAXEvent ('<a href="#">').attributes.entries ())).toStrictEqual ({href: '#'})

})