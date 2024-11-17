const fs = require ('fs')
const Path = require ('path')
const {PassThrough} = require ('stream')
const {XMLParser, XMLReader, SAXEvent, XMLLexer} = require ('../')

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
	expect (() => {const l = new XMLLexer (); l.state = null; l.parse ()}).toThrow ()

})

test ('reader vs Parser', async () => {

	await readerVsParser ('amp.xml', {stripSpace: false})
	await readerVsParser ('param_types.xml', {useEntities: false, useNamespaces: false, filterElements : 'PARAMTYPES'})
	await readerVsParser ('schemas.xmlsoap.org.xml')
	await readerVsParser ('E05a.xml')
	await readerVsParser ('not-sa01.xml')
//	await readerVsParser ('not-sa02.xml')

})

test ('sax', async () => {

//	const path = Path.join (__dirname, '..', '__data__', 'amp.xml')

	const reader = new XMLReader ()

	const xml = await new Promise ((ok, fail) => {

		reader.on ('error', fail)
		reader.on (SAXEvent.TYPES.END_DOCUMENT, e => ok (e.xml))

		reader.process ('<a/>')

	})

	expect (xml).toBe ('')

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

test ('unbalanced', async () => {

	const reader = new XMLReader ({filterElements : 'PARAMTYPES'})

	await expect (
		
		new Promise ((ok, fail) => {
			reader.findFirst ().then (ok, fail)
			reader.end ('</a>')
		})
	
	).rejects.toBeDefined ()

})

test ('overflow', async () => {

	const src = new PassThrough ()

	const reader = new XMLReader ({filterElements : 'PARAMTYPES'}).process (src, {maxLength: 10})

	await expect (
		
		new Promise ((ok, fail) => {
			reader.findFirst ().then (ok, fail)
			src.write ('<a href="#"     ')
			src.end ('>')
		})
	
	).rejects.toBeDefined ()

})