# 4. The Asynchronous Parser: XMLReader

While `XMLParser` offers simplicity for small documents, real-world enterprise integrations rarely fit comfortably into memory. `XMLReader` is the streaming counterpart that processes XML incrementally, yielding nodes as they are encountered. This chapter explains when to choose it, how to configure it for efficient data extraction, and how to integrate it into both pull-based and push-based Node.js workflows.

## 4.1 When to use XMLReader

`XMLReader` is purpose-built for scenarios where memory footprint, latency, or document size make synchronous parsing impractical.

**Choose `XMLReader` when:**
- Processing files larger than 50–100 MB, or when file size is unbounded (e.g., continuous log exports, database dumps)
- Running on memory-constrained environments (containers, serverless functions, edge workers)
- You only need specific sections of the document and can discard the rest
- You want to process records incrementally as they arrive over a network stream
- Early termination is required (e.g., finding the first matching element and stopping)

**Avoid `XMLReader` when:**
- You need random access to arbitrary parts of the document after parsing
- Your processing logic requires global context or cross-references between distant sections
- You are building quick prototypes with small, known-safe XML inputs

**The streaming trade-off:**
`XMLReader` never builds the full document tree. Instead, it maintains a shallow stack representing the current parsing path. As soon as an end tag is encountered, the corresponding subtree is released unless you explicitly retain it. This design keeps memory usage proportional to the maximum nesting depth, not the total file size.

## 4.2 Configuring filters and mappers

To avoid yielding every single node in a large document, `XMLReader` supports declarative filtering and transformation during instantiation.

### Basic configuration

```javascript
const { XMLReader } = require('xml-toolkit');
const fs = require('fs');

const reader = new XMLReader({
  // filter      : node    => node.type === 'EndElement' && node.level === 1,
  filterElements : element => element.level === 1,
  map            : XMLNode.toObject ({}),
}).process (fs.createReadStream('large-export.xml', { encoding: 'utf8' }));
```

### The `filter` / `filterElements` option
The `filter` predicate runs on each SAX event occured. Returning a [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) values causes the event to be yielded; otherwise it's skipped.

When parsing XML, you rarely need anything but elements in your output (bare text nodes are nearly meaningless). And for elements, you want attributes and child nodes together, not distinct `start` and `end` SAX events. This is why the `filter` option must virtually always include the `type='EndElement'` condition.

This is why, instead of the raw `filter` option, the `filterElements` wrapper is commonly used.

Common filtering patterns:
```javascript
// Match by localName only
filterElements: 'order'                      // you can mention is as a string
filterElements: e => e.localName === 'order' // same thing

// Match by namespace and localName
filterElements: e => e.localName === 'product' && e.namespaceURI === 'http://shop.example.com'

// Match by level
filterElements: e => e.level === 1

// Match by attribute value
filterElements: n => n.attributes.get ('status') === 'active'
```

> **Note**: Filters execute synchronously so they must be highly optimized.

### The `map` function
The `map` transforms the yielded object before it reaches your code. This is ideal for extracting only the fields you need, converting types, or flattening structures.

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

**Important:** Mappers run synchronously. For heavy computation or I/O, collect minimal data in the mapper and defer processing to your iteration loop.

## 4.3 Pull mode: iterating with for-await-of

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

## 4.4 Push mode: event listeners and streams

While pull mode is preferred for modern JavaScript, `XMLReader` also exposes a traditional event emitter interface for compatibility with legacy codebases or complex stream orchestration.

### Event-based consumption

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

## 4.5 Combining with Node.js streams pipeline

`XMLReader` seamlessly integrates with Node.js `stream.pipeline` API, enabling robust, error-handled data flows that respect backpressure across all components.

### Pipeline example: XML to CSV conversion

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

### Parallel processing considerations
If your downstream processing is CPU-intensive, split the stream inside the pipeline:

```javascript
// Inside pipeline:
new Transform({
  objectMode: true,
  transform(chunk, enc, cb) {
    // Offload heavy work to worker threads or queue
    workerPool.run(processRecord, chunk, cb);
  }
}),
```

`XMLReader` will continue parsing at the pace dictated by your worker pool, preventing memory exhaustion while maintaining throughput.

## 4.5 Error handling and diagnostics

`XMLReader` handles errors differently from `XMLParser` due to its streaming, event-driven architecture. While validation message codes and formats are identical to those documented above, the delivery mechanism and recovery strategies differ significantly.

### 4.5.1 Stream-level errors: the `error` event

`XMLReader` is a Node.js []`Transform`](https://nodejs.org/docs/latest/api/stream.html#class-streamtransform) stream. Low-level parsing failures—such as malformed XML that breaks the underlying `XMLLexer`—propagate via the standard `error` event:

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

- **Automatic destruction**: When the internal `XMLLexer` emits an `error`, `XMLReader` calls `this.destroy(err)`, terminating the stream and preventing further `data` events [[source]].
- **Async iteration safety**: `for-await-of` loops handle stream errors gracefully—the loop exits and the error is available via the `error` event handler.
- **No recovery**: Unlike validation messages (see below), stream-level errors are fatal. The document cannot be partially processed once the lexer fails.

> ⚠️ **Always attach an `error` handler before calling `process()`**. Unhandled stream errors may crash your Node.js process.


## 4.5.2 Schema validation: the `validation-message` event

When the `xs` option is provided, `XMLReader` performs schema validation. Unlike `XMLParser`, which collects messages in an array, `XMLReader` **emits each validation message immediately** via the `validation-message` event:

```javascript
const { XMLReader, XMLSchemata } = require('xml-toolkit')

const xs = new XMLSchemata('schema.xsd')
const reader = new XMLReader({ xs })
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

### How validation works internally

1. On the first `START_ELEMENT` event, `XMLReader` instantiates an `XMLValidator` with your schema and a callback that emits `validation-message` [[source]].
2. As parsing proceeds, the validator checks each element, attribute, and text node against the schema.
3. Any violation triggers `emit('validation-message', formattedString)`—**not** an exception.

### Important distinctions from `XMLParser`

| Aspect | `XMLParser` (sync) | `XMLReader` (async/streaming) |
|--------|-----------------|-------------------------------|
| **Message collection** | `parser.validationMessages` array | `validation-message` event emissions |
| **Timing** | All messages available after `process()` returns | Messages emitted incrementally during parsing |
| **Control flow** | You inspect array post-parsing | You handle each message as it arrives |
| **Memory** | All messages held in memory | Messages processed on-the-fly (lower memory) |

