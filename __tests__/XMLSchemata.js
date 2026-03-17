const path = require('path')
const { XMLSchemata, XMLParser, XMLNode} = require ('../')

test('cyclic import', async () => {
    const xsdPath = path.join(__dirname, '..', '__data__', '30213','RequestEGRN_v026.xsd')

    const schemata = await new Promise((resolve, reject) => {
        XMLSchemata.fromFile(xsdPath)
            .then(s => resolve(s))
            .catch(e => reject(e))
    })

    expect (schemata).toBeDefined ()
    expect (schemata.size).toBeGreaterThan (0)

    expect (schemata.getDebugQName ('order')).toBe ('order')
    expect (schemata.getDebugQName ('order', null)).toBe ('order')
    expect (schemata.getDebugQName ('order', undefined)).toBe ('order')
    expect (schemata.getDebugQName ('order', 'http://tempuri.org/')).toBe ('{http://tempuri.org/}order')

})

test ('include', () => {

    const xs = new XMLSchemata (path.join (__dirname, '..', '__data__', 'xsinc', 'app.xsd'))

    const xml = `
        <gml:FeatureCollection xmlns:gml=\"http://www.opengis.net/gml/3.2\" xmlns:app=\"http://app\">
            <gml:featureMember>
                <app:ElectricLine><app:GLOBALID>{test-uuid}</app:GLOBALID></app:ElectricLine>
            </gml:featureMember>
        </gml:FeatureCollection>
    `.trim ()

    const d = new XMLParser ({
        xs
    }).process (xml)

    const o = XMLNode.toObject () (d)

    expect (o).toEqual ({
        featureMember: { 
            ElectricLine: { 
                GLOBALID: '{test-uuid}' 
            } 
        } 
    })

})
