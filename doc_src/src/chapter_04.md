# 4. The Asynchronous Parser: XMLReader

## 4.1 When and why to use XMLReader

Sometimes you have to deal with XML documents so large that even their text (not to mention the internal representation) already exceeds the available memory. Or they may fit, but be large enough for their synchronous reading to be unacceptable. In such cases you absolutely need incremental processing. There are quite a few `npm` modules offering such a feature:
- [`sax`](https://www.npmjs.com/package/sax),
- [`saxophone`](https://www.npmjs.com/package/saxophone),
- [`EasySAX`](https://www.npmjs.com/package/easysax).

All of them implement adoptions of [Simple API for XML](http://www.saxproject.org/) to the node.js platform: [event emitters](https://nodejs.org/docs/latest/api/events.html) fed by incoming chunks of text via `.write()` methods. For a one-off task, such a tool can come as a salvation, but using it in general is quite inconvenient.

Large XML files are mostly database dumps: a typical document has a single long sequence of similar elements representing records of a relational table. And, in your application logic, you need those records, not anything else. Preferably, in form of a [readable stream](https://nodejs.org/docs/latest/api/stream.html#readable-streams).

For self-enclosed elements with all fields as attributes:

```xml
<root>
  <record id="1" label="one" />
  <record id="2" label="two" />
  <!-- ... --->
```

each `'start'` event carries the complete record, so SAX is OK.

But when those same values are written as child elements, even one level deep:

```xml
<root>
  <record>
    <id>1</id><label>one</label>
  </record>
  <record>
    <id>2</id><label>two</label>
  </record>
  <!-- ... --->
```
you already have to maintain a stack for building something like restricted DOM trees. Sure it's doable, but it's clearly not an application level task.

And now, imagine you have to validate the input against an XML Schema...

Well, `XMLParser` is designed to fill all the gaps noted above. At the very core, there is yet another SAX event emitter, but wrapped into a  stream of objects ready to use in business logic.

## 4.2 Setup

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
  .process (src);
```

Now, reader is an [object mode](https://nodejs.org/docs/latest/api/stream.html#object-mode) [readable stream](https://nodejs.org/docs/latest/api/stream.html#readable-streams). Without any configuration options, it will publish every [`SAXEvent`](https://github.com/do-/node-xml-toolkit/wiki/SAXEvent) occurred.

It's worth noting here that, in `node-xml-toolkit`, [`XMLNode`](https://github.com/do-/node-xml-toolkit/wiki/XMLNode)s are considered particular cases of `SAXEvent`s: those with `type='EndElement'`. To be usable in business logic, `XMLReader`'s output is often filtered and transformed as early as possible. To this end, it features two options described in the next sections.

### `filterElements`

To exclude from the stream all but completely read elements (which is needed virtually always), use the `filterElements` option. This is a predicate which is run on every `'EndElement'` event. Its argument is an [`XMLNode`](https://github.com/do-/node-xml-toolkit/wiki/XMLNode) instance, with all attributes and children in place.

Here are some common filtering patterns:
```javascript
// Match by localName only
filterElements: 'order'                      // you can mention is as a string
filterElements: e => e.localName === 'order' // same thing

// Match by namespace and localName
filterElements: e => e.localName === 'product' && e.namespaceURI === 'http://shop.example.com'

// Match by level
filterElements: e => e.level === 1           // the root's children

// Match by attribute value
filterElements: n => n.attributes.get ('status') === 'active'
```

> **Note**: Filters execute synchronously so they must be highly optimized.

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
}
```

**Important:** Mappers too run synchronously. For heavy computation or I/O, collect minimal data in the mapper and defer processing to your iteration loop.

## 4.3 Building streams pipelines

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

### Why pipelines matter
- **Automatic backpressure**: If the CSV writer slows down (e.g., disk I/O bottleneck), the pipeline pauses the `XMLReader`, which pauses the underlying file stream. Memory remains bounded.
- **Centralized error handling**: A single `try/catch` around `pipeline()` captures errors from any stage.
- **Resource cleanup**: On completion or error, all streams are automatically closed and file descriptors released.

### Error handling in pipelines

```javascript
try {
  await pipeline(/* streams */);
} catch (err) {
  // err.cause contains the original error from the failing stage
  console.error('Pipeline failed at:', err.cause?.constructor?.name);
  console.error('Message:', err.message);
}
```

## 4.4 Pull mode: iterating with for-await-of

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

## 4.5 Push mode: event listeners

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

## 4.6 Error handling and diagnostics

`XMLReader` handles errors differently from `XMLParser` due to its streaming, event-driven architecture. While validation message codes and formats are identical to those documented above, the delivery mechanism and recovery strategies differ significantly.

### 4.6.1 Stream-level errors: the `error` event

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

#### Key behaviors

- **Automatic destruction**: When the internal `XMLLexer` emits an `error`, `XMLReader` calls `this.destroy(err)`, terminating the stream and preventing further `data` events.
- **Async iteration safety**: `for-await-of` loops handle stream errors gracefully—the loop exits and the error is available via the `error` event handler.
- **No recovery**: Unlike validation messages (see below), stream-level errors are fatal. The document cannot be partially processed once the lexer fails.

> ⚠️ **Always attach an `error` handler before calling `process()`**. Unhandled stream errors may crash your Node.js process.


### 4.6.2 Schema validation: the `validation-message` event

When the `xs` option is provided, `XMLReader` performs schema validation. Unlike `XMLParser`, which collects messages in an array, `XMLReader` **emits each validation message immediately** via the `validation-message` event:

```javascript
const { XMLReader, XMLSchemata } = require('xml-toolkit')

const xs = new XMLSchemata('schema.xsd')
const reader = new XMLReader({ xs, filterElements: e => e.level === 1 })
  .on('error', err => console.error(err))
  .on('validation-message', (msg) => {
    // msg format: "<CODE> <message>" (same as XMLParser)
    console.warn('Schema issue:', msg)
    // Decide whether to ignore, log, or abort
  })

reader.process(fs.createReadStream('data.xml'))

for await (const node of reader) {
  // Nodes are still yielded even if validation messages were emitted
  console.log(node.localName)
}
```

#### How validation works internally

1. On the first `START_ELEMENT` event, `XMLReader` instantiates an `XMLValidator` with your schema and a callback that emits `validation-message` [[source]].
2. As parsing proceeds, the validator checks each element, attribute, and text node against the schema.
3. Any violation triggers `emit('validation-message', formattedString)`—**not** an exception.

#### Important distinctions from `XMLParser`

| Aspect | `XMLParser` (sync) | `XMLReader` (async/streaming) |
|--------|-----------------|-------------------------------|
| **Message collection** | `parser.validationMessages` array | `validation-message` event emissions |
| **Timing** | All messages available after `process()` returns | Messages emitted incrementally during parsing |
| **Control flow** | You inspect array post-parsing | You handle each message as it arrives |
| **Memory** | All messages held in memory | Messages processed on-the-fly (lower memory) |

