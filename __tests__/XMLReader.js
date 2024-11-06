const fs = require ('fs')
const Path = require ('path')
const {XMLParser, XMLReader, SAXEvent} = require ('../')

async function readerVsParser (fn, options = {}) {

	const path = Path.join (__dirname, '..', '__data__', fn)

	const doc = (new XMLParser (options).process (fs.readFileSync (path, 'utf-8'))).detach ()

	const newReader = () => new XMLReader ({
		filterElements : e => e.level === 0,
		map            : _ => _.detach (),
		...options
	}).process (fs.createReadStream (path))

	expect (await newReader ().findFirst ()).toStrictEqual (doc)

	for await (const record of newReader ()) expect (record).toStrictEqual (doc)

}

test ('bad', () => {

	expect (() => new XMLReader ({filterElements: Symbol ()})).toThrow ()
	expect (() => new XMLReader ({stripSpace: Symbol ()})).toThrow ()
	expect (() => new XMLReader ({collect: Symbol ()})).toThrow ()

})

test ('reader vs Parser', async () => {

	await readerVsParser ('amp.xml', {stripSpace: false})

	await readerVsParser ('param_types.xml', {useEntities: false, useNamespaces: false, filterElements : 'PARAMTYPES'})

	await readerVsParser ('schemas.xmlsoap.org.xml')

})

test ('sax', async () => {

//	const path = Path.join (__dirname, '..', '__data__', 'amp.xml')

	const reader = new XMLReader ()

	await new Promise ((ok, fail) => {

		reader.on ('error', fail)
		reader.on (SAXEvent.TYPES.END_DOCUMENT, ok)

		reader.process ('<a/>')

	})

	expect (null).toBeNull ()

})

test ('find none', async () => {

	const reader = new XMLReader ({filterElements : 'PARAMTYPES'})

	const result = await new Promise ((ok, fail) => {
		reader.findFirst ().then (ok, fail)
		reader.write ('<a />')
		reader.write ('')
		reader.end ()		
	})

	expect (result).toBeNull ()

})