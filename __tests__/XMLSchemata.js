const path = require('path')
const { XMLSchemata } = require('../')

test('cyclic import', async () => {
    const xsdPath = path.join(__dirname, '..', '__data__', '30213','RequestEGRN_v026.xsd')

    const schemata = await new Promise((resolve, reject) => {
        XMLSchemata.fromFile(xsdPath)
            .then(s => resolve(s))
            .catch(e => reject(e))
    })

    expect(schemata).toBeDefined()
    expect(schemata.size).toBeGreaterThan(0)
})