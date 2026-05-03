---
layout: default
title: "Streaming XMLReader"
---
# The Asynchronous Streaming Parser: `XMLReader`

* toc
{:toc}


Sometimes you have to deal with XML documents so large that even their text (not to mention the internal representation) already exceeds the available memory. 

Or they may fit, but be large enough for their synchronous reading to be unacceptable. 

In such cases you need incremental processing provided by `XMLReader`.

## Basic Usage

This is how a typical `XMLReader` initialization looks like:

```javascript
const { XMLReader } = require('xml-toolkit');
const fs = require('fs');

const src = fs.createReadStream('large-export.xml', { encoding: 'utf8' })
const reader = new XMLReader({
  filterElements : e => e.level === 1,
  map            : XMLNode.toObject ({}),
  // xs          : new XMLSchemata('schema.xsd'),
})
  .on('error', err => console.error (err))
  // .on('validation-message', err => console.warn (err))
  .process (src);
```

Now, `reader` is an [object mode](https://nodejs.org/docs/latest/api/stream.html#object-mode) [readable stream](https://nodejs.org/docs/latest/api/stream.html#readable-streams). Without any configuration options, it will would publish every [`SAXEvent`](https://github.com/do-/node-xml-toolkit/wiki/SAXEvent) occurred.

It's worth noting here that, in `node-xml-toolkit`, [`XMLNode`](https://github.com/do-/node-xml-toolkit/wiki/XMLNode)s are considered particular cases of `SAXEvent`s: those with `type='EndElement'`. To be usable in business logic, `XMLReader`'s output is often filtered and transformed as early as possible. To this end, the API features options described in the next sections.

### `filterElements`

To exclude from the stream all but completely read elements (which is needed virtually always), use the `filterElements` option. This is a predicate which is run on every `'EndElement'` event. Its argument is an [`XMLNode`](https://github.com/do-/node-xml-toolkit/wiki/XMLNode) instance, with all attributes and children in place.

Here are some common filtering patterns:
```javascript
// Match by localName only
filterElements: 'order',                      // you can mention is as a string
filterElements: e => e.localName === 'order', // same thing

// Match by namespace and localName
filterElements: e => e.localName === 'product' && e.namespaceURI === 'http://shop.example.com',

// Match by level
filterElements: e => e.level === 1,          // the root's children

// Match by attribute value
filterElements: n => n.attributes.get ('status') === 'active',
```

### `map`
The `map` transforms the yielded object before it reaches your code. This is ideal for extracting only the fields you need, converting types, or flattening structures.

`XMLNode.toObject ()` (see Chanter 5) is designed to fit in most cases. Or you can tailor a custom mapper like

```javascript
map: node => {
  // Extract specific children safely
  const sku = node.children.find(c => c.localName === 'sku')?.innerText;
  const weight = node.children.find(c => c.localName === 'weight')?.innerText;
  
  return {
    sku: sku?.trim(),
    weightKg: parseFloat(weight) || null,
    processedAt: new Date().toISOString()
  };
},
```

### `xs`

Like its cousin `XMLParser`, `XMLReader` allows [`XMLSchemata`](../XMLSchemata) instances as `xs` options:

```javascript
  xs: new XMLSchemata('schemas/catalog.xsd'),
```

Provided one, it validates the content processed on the fly and reports on inconsistencies found via the `'validation-message'` event:
```javascript
  reader.on('validation-message', (msg) => {
    console.warn('Schema issue:', msg)
  })
```

## Streams pipelines

`XMLReader` seamlessly integrates with Node.js `stream.pipeline` API, enabling robust, error-handled data flows that respect backpressure across all components.

```javascript
const { pipeline } = require('stream/promises');
const { XMLReader } = require('xml-toolkit');
const { Transform } = require('stream');
const fs = require('fs');

function createCsvWriter() {
  let isFirst = true;
  return new Transform({
    objectMode: true,
    transform(record, encoding, callback) {
      const headers = isFirst ? `id,name,price,timestamp\n` : '';
      const row = `${record.id},"${record.name}",${record.price},${record.timestamp}\n`;
      isFirst = false;
      callback(null, headers + row);
    }
  });
}

async function xmlToCsv(inputPath, outputPath) {
  await pipeline(
    new XMLReader({
      filter: n => n.localName === 'record',
      mapper: node => ({
        id: node.attributes.id,
        name: node.children.find(c => c.localName === 'name')?.innerText?.trim(),
        price: node.children.find(c => c.localName === 'price')?.innerText,
        timestamp: new Date().toISOString()
      })
    })
      .on('error', err => console.error(err))    
      .process (fs.createReadStream(inputPath, { highWaterMark: 64 * 1024 })),
    createCsvWriter(),
    fs.createWriteStream(outputPath)
  );
  console.log('Conversion complete.');
}
```

## Pull mode: `for await`

Being a subclass of [`Readable`](https://nodejs.org/docs/latest/api/stream.html#readable-streams), `XMLReader` implements the [`AsyncIterable`](https://tc39.es/ecma262/#sec-asynciterable-interface) protocol, making [`for await...of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of) available:

### Basic iteration

```javascript
async function processRecords(filepath) {
  const reader = new XMLReader({
    filterElements: 'record'
  })
    .on('error', err => console.error(err))  
    .process (fs.createReadStream(filepath));

  let count = 0;
  for await (const record of reader) {
    // Process each record
    await saveToDatabase(record); // ATTN! performance killer; demo only
    count++;
    
    // Optional: log progress
    if (count % 1000 === 0) {
      console.log(`Processed ${count} records...`);
    }
  }
  console.log(`Complete. ${count} records processed.`);
}
```

### Early termination

Because parsing is driven by your iteration, you can stop reading at any point:

```javascript
for await (const node of reader) {
  if (node.attributes.id === targetId) {
    console.log('Found target node');
    break; // Stops iteration and closes underlying stream
  }
}
```

When `break` is executed, `XMLReader` automatically destroys the input stream and releases internal buffers. No manual cleanup is required.

## Push mode: event listeners

While using pipelines seems to be the best way to implement incremental data processing and `for await` is a syntactical sugar good enough for fast prototyping, old school raw event listeners are always here:

```javascript
const reader = new XMLReader({
  filterElements: 'transaction'
})
  .on('error', err => console.error(err))
  .process (fs.createReadStream('data.xml'));

reader.on('error', (err) => {
  console.error('Parsing error:', err.message, err.line, err.column);
});

reader.on('end', () => {
  console.log('Stream ended successfully');
});

reader.on('data', async (node) => {
  try {
    fastSyncProcessTransaction(node); // it MUST be synchronous and real fast
  } catch (err) {
    // Errors in event handlers must be caught explicitly
    console.error('Transaction processing failed:', err);
  }
});
```

## Error handling

`XMLReader` handles errors differently from `XMLParser` due to its streaming, event-driven architecture. While validation message codes and formats are identical, the delivery mechanism and recovery strategies differ significantly.

`XMLReader` is a Node.js [`Transform`](https://nodejs.org/docs/latest/api/stream.html#class-streamtransform) stream. Low-level parsing failures—such as malformed XML that breaks the underlying `XMLLexer`—propagate via the standard `error` event:

```javascript
const { XMLReader } = require('xml-toolkit')

const reader = new XMLReader()
  .on('error', (err) => {
    // Catch lexer errors: malformed XML, encoding issues, etc.
    console.error('Stream error:', err.message)
    // The stream is automatically destroyed; iteration stops
  })

// Attach error handler BEFORE calling process()
reader.process(fs.createReadStream('data.xml'))

for await (const node of reader) {
  // Loop terminates automatically if an error occurs
  console.log(node.localName)
}
```