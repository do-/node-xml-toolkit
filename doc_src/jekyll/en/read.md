---
layout: default
title: Reading XML
---
# Reading XML

* toc
{:toc}

In this section, there are some boilerplate code good for most practical tasks with parsing XML.

For clarifications on the API, follow the related links.

## Slurp a whole document

When your input is small enough (<10 Mb), there is nothing wrong with using the [synchronous `XMLParser`](../XMLParser):

```javascript
const { XMLParser, XMLSchemata } = require('xml-toolkit');
const fs = require('fs');

const parser = new XMLParser({
  // xs: new XMLSchemata ('schema.xsd')
});
const doc = parser.process(fs.readFileSync('manifest.xml', 'utf8'));

// console.log (parser.validationMessages)

const obj = XMLNode.toObject({wrap: true})(doc);
console.log (obj);
```

Then, either [convert the result to a plain object](../XMLNode.toObject) or [explore its internals directly](../XMLNode).

## Read a long record list

For huge XML with linear structure (i. e. containing one list of uniform elements), copy/paste/uncomment the necessary of the next code template:

```javascript
const records = new XMLReader ({
const {XMLReader, XMLNode, XMLSchemata} = require ('xml-toolkit')

const records = new XMLReader ({
// xs: new XMLSchemata ('schema.xsd'),  
  map            :  XMLNode.toObject ({}),
  filterElements : 'Record',
//filterElements :  e => e.localName === 'Record'
//                    && e.level === 1 
//                    && e.attributes.get ('status') === '1'
//                    && e.namespaceURI === 'http://shop.example.com'
})
  .on('error', err => console.error(err))
  .process (xmlSource)

// ...then:
// records.pipe (nextStream)

// ...or
// for await (const record of records) {...} // pull parser mode

// ...or
// records
//   .on ('end', () => someSyncEOFHandler ())
//   .on ('data', record => doSomethingWith (record))

// ...or
// await someAsyncFunctionAcceptingReadableStream (records)
```

Anyway, [`XMLReader`](../XMLReader) is a [`Readable stream`](https://nodejs.org/docs/latest/api/stream.html#readable-streams) or objects like those that a produced by `XMLParser`.

## Find a single element

For the case where you need to find a single element in a large XML file, use the special `.findFirst()` method:

```javascript
const { XMLReader } = require('xml-toolkit');
const fs = require('fs');
async function extractTargetValue(filepath, targetName) {
  const reader = new XMLReader({
    filterElements: targetName
  })
    .on('error', err => console.error(err))
    .process(fs.createReadStream(filepath));

  const target = await reader.findFirst()
  if (target === null) throw new Error(`${targetName} not found in ${filepath}`);
  console.log (target.toString ());
}
```

The source is read to the end only if the element in question is missing from it.