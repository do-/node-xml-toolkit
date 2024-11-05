const fs = require ('fs')
const path = require ('path')

const {XMLIterator, EntityResolver} = require ('../')

test ('basic', async () => {

	const src = fs.readFileSync (path.join (__dirname, '..', '__data__', 'param_types.xml'), 'utf-8')

	const xi = new XMLIterator (src)

	expect ([...xi]).toHaveLength (34)

})

test ('er', async () => {

	const src = fs.readFileSync (path.join (__dirname, '..', '__data__', 'param_types.xml'), 'utf-8')

	const entityResolver = new EntityResolver ()

	const xi = new XMLIterator (src, {entityResolver})

	expect (xi.entityResolver).toBe (entityResolver)

	expect ([...xi]).toHaveLength (34)

})
