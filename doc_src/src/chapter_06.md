# 6. Practical Reading Patterns

This chapter presents some basic patterns for using `XMLParser` and `XMLReader` in typical application tasks.

## 6.1 Slurping a whole document

When your input is small enough (<10 Mb), there is nothig wrong with the following trivial scenario:

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

// or you may operate on `doc` directly
```

## 6.2 Extracting a single element

Suppose you need to locate one piece of data in an XML document. The optimal approach depends on document size and your latency tolerance.

### Synchronous approach for small files

For configuration files, small messages etc. this problem is a trivial particular case of thre previuos one:

```javascript
const { XMLParser } = require('xml-toolkit');
const fs = require('fs');

const {version} = XMLNode.toObject({wrap: true})(
  (new XMLParser()).process (fs.readFileSync('manifest.xml', 'utf8'))
);

console.log (version);
```

### Asynchronous approach: `XMLReader.findFirst()`

For large files, parsing the entire tree just to extract one value is wasteful. `XMLReader.findFirst()` stops the parsing on the first node satisfying the condition, and returns it:

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
  return target;
}
```

The source is read to the end only if the element in question is missing from it.

## 6.3 Reading a record list

For huge XML with linear structure (i. e. containing one long list of uniform elements), copy/paste/uncomment the necessary of the next code template:

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