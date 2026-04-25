# Part I: Foundations

## 1. Introduction

### 1.1 Why node-xml-toolkit?

Node.js has become a dominant platform for building scalable, event-driven applications. Yet, despite XML's continued relevance in enterprise integration, configuration management, and legacy system interoperability, the Node.js core provides no built-in, high-level tools for working with XML.

Third-party libraries exist, but many are either too heavyweight, lack streaming support, or require native bindings that complicate deployment. `node-xml-toolkit` was created to fill this gap with a pure JavaScript solution that prioritizes three things:

- **Minimal computing resources**: Process multi-gigabyte XML files without exhausting memory.
- **Minimal application code**: Solve common XML tasks with concise, readable patterns.
- **Minimal external dependencies**: Avoid complex build chains and platform-specific binaries.

If you need to parse large XML exports, invoke SOAP services defined by WSDL, or serialize JavaScript objects into schema-compliant XML—without pulling in a dozen npm packages—`node-xml-toolkit` is designed for you.

### 1.2 What problems does it solve?

This library addresses several recurring challenges in Node.js XML development:

| Problem | How node-xml-toolkit helps |
|---------|---------------------------|
| **Memory exhaustion when parsing large files** | Asynchronous streaming parsers (`XMLReader`, `XMLLexer`) process documents incrementally, keeping memory usage bounded regardless of file size. |
| **Boilerplate-heavy XML navigation** | High-level helpers like `XMLNode.toObject()` convert parsed structures into plain JavaScript objects, reducing manual traversal code. |
| **Schema validation complexity** | `XMLSchemata` and `XMLMarshaller` enable optional validation and schema-driven serialization without requiring external tools. |
| **SOAP client development** | `SOAP11` and `SOAP12` classes interpret WSDL files and generate properly formatted HTTP requests from plain JavaScript objects. |
| **On-the-fly XML modification** | Streaming patching patterns allow targeted replacements without loading the entire document into memory. |
| **Consistent XML output formatting** | `XMLPrinter` and `XMLStreamPrinter` provide configurable indentation, encoding, and namespace handling for generated XML. |

### 1.3 Design philosophy: minimal dependencies, minimal code, minimal resources

`node-xml-toolkit` follows a pragmatic, "do one thing well" philosophy:

- **Pure JavaScript**: No native addons, no platform-specific compilation. Install via npm and run anywhere Node.js runs.
- **Modular architecture**: Components are decoupled. Use only what you need—parsers, serializers, SOAP tools, or validation—without importing the entire toolkit.
- **Streaming-first**: Wherever possible, APIs support both pull (`for await...of`) and push (`.on('data')`) patterns, integrating naturally with Node.js streams.
- **Explicit over implicit**: Configuration options are clear and documented. There is no hidden magic that makes debugging difficult.
- **Practical validation**: XML Schema support covers the features most commonly used in real-world integrations. Advanced or obscure XSD constructs are acknowledged but not prioritized, keeping the implementation lean.

This philosophy means the library may not implement every corner of the W3C specifications—but it reliably solves the problems developers actually encounter in production.

### 1.4 Prerequisites: Node.js and XML fundamentals

To get the most from this book and from `node-xml-toolkit`, you should be comfortable with:

- **Node.js fundamentals**: Modules (`require`/`import`), asynchronous programming (callbacks, Promises, `async`/`await`), and the Streams API.
- **XML basics**: Elements, attributes, namespaces, character data, and document structure. Familiarity with XPath concepts is helpful but not required.
- **XML Schema (XSD) awareness**: Understanding of simple vs. complex types, element declarations, and namespace scoping will help when using validation or marshalling features.
- **SOAP concepts (optional)**: If you plan to use the SOAP integration, basic knowledge of WSDL, SOAP envelopes, and RPC-style messaging will accelerate your progress.

No prior experience with other Node.js XML libraries is assumed. If you have used `xml2js`, `sax`, or `fast-xml-parser`, you will notice architectural differences—`node-xml-toolkit` favors explicit streaming control over automatic object mapping.

### 1.5 Installation and setup

`node-xml-toolkit` is published to npm under the package name `xml-toolkit`.

#### Basic installation

```bash
npm install xml-toolkit
```

Or with Yarn:

```bash
yarn add xml-toolkit
```

#### Verifying the installation

Create a test file `verify.js`:

```javascript
const { XMLParser } = require('xml-toolkit');

const xml = '<root><item id="1">Hello</item></root>';
const parser = new XMLParser();
const doc = parser.process(xml);

console.log(doc.children[0].localName); // outputs: item
console.log(doc.children[0].attributes.id); // outputs: 1
```

Run it:

```bash
node verify.js
```

If you see the expected output, the library is correctly installed.

#### Environment requirements

- **Node.js**: Version 14 or higher is recommended. The library uses modern JavaScript features (async iterators, optional chaining) that require a recent runtime.
- **No build step**: The package is ready to use after installation. No TypeScript compilation or native module rebuilding is needed.
- **Optional dependencies**: None. All functionality is included in the core package.

#### Next steps

With the toolkit installed, you are ready to explore its capabilities. The following chapters will guide you through:

- Choosing between synchronous and asynchronous parsing strategies
- Navigating and transforming parsed XML documents
- Validating input against XML Schema definitions
- Generating well-formed, schema-compliant XML output
- Building SOAP clients that interact with enterprise web services

Each concept is introduced with runnable examples that you can adapt to your own projects. The goal is not just to explain how the library works, but to equip you with patterns you can apply immediately to real-world tasks.

## 2. Core Concepts

Before diving into code examples, it is essential to understand the architectural decisions and mental models that underpin `node-xml-toolkit`. This chapter establishes the foundational concepts that will make the rest of the book—and your usage of the library—more intuitive and effective.

### 2.1 Synchronous vs. asynchronous parsing

`node-xml-toolkit` offers two distinct parsing approaches, each suited to different scenarios:

#### Synchronous parsing with `XMLParser`

```javascript
const { XMLParser } = require('xml-toolkit');

const parser = new XMLParser();
const doc = parser.process('<catalog><product id="101">Widget</product></catalog>');

console.log(doc.children[0].textContent); // Widget
```

**Use `XMLParser` when:**
- The XML document is small to medium-sized (typically under 10–50 MB, depending on available memory)
- You need random access to any part of the document after parsing
- Simplicity and readability are prioritized over memory efficiency
- You are processing configuration files, small API responses, or test data

**Trade-offs:**
- The entire document is loaded into memory as a tree of `XMLNode` objects
- Parsing blocks the event loop until completion (though this is usually negligible for small files)

#### Asynchronous parsing with `XMLReader`

```javascript
const { XMLReader } = require('xml-toolkit');
const fs = require('fs');

async function processLargeFile(filepath) {
  const reader = new XMLReader().process (fs.createReadStream(filepath));
  
  for await (const node of reader) {
    if (node.localName === 'product' && node.attributes.id === '101') {
      console.log(await node.getTextContent());
      break; // Early exit possible
    }
  }
}
```

**Use `XMLReader` when:**
- Processing large files (hundreds of MB or GB) where memory usage must remain bounded
- You can process data incrementally (e.g., filtering, transforming, or aggregating as you read)
- You want to integrate with Node.js streams pipelines
- You need to stop parsing early once a condition is met

**Trade-offs:**
- Requires `async`/`await` or event-based handling
- Random access to arbitrary parts of the document is not possible without re-parsing
- Slightly more verbose setup for simple use cases

#### Choosing the right approach

| Scenario | Recommended parser |
|----------|-------------------|
| Loading application config (`config.xml`) | `XMLParser` |
| Parsing a 2 GB export from a legacy system | `XMLReader` |
| Extracting a single value from a known path | `XMLParser` (if file is small) or `XMLReader` with early exit |
| Transforming records and writing to another stream | `XMLReader` + `XMLStreamPrinter` |
| Unit testing XML generation logic | `XMLParser` for simplicity |

### 2.2 Streaming architecture and memory efficiency

At its core, `node-xml-toolkit` is built around streaming principles. Even the synchronous `XMLParser` uses a streaming lexer internally; it simply consumes the entire stream before returning.

#### The streaming pipeline

```
Raw bytes → XMLLexer → SAXEvent stream → XMLReader/XMLParser → XMLNode tree (optional)
```

- **`XMLLexer`**: The lowest-level component. It tokenizes raw character data into SAX-style events (`startElement`, `endElement`, `characters`, etc.). It is memory-efficient but requires you to manage state.
- **`XMLReader`**: Builds on `XMLLexer` to provide a higher-level, node-oriented async iterator. It yields `XMLNode` objects incrementally, allowing you to process documents without building the full tree.
- **`XMLParser`**: Consumes the entire event stream from `XMLLexer` and constructs a complete in-memory document tree.

#### Memory usage patterns

- **Tree-based parsing** (`XMLParser`): Memory usage scales with document size and complexity. A 100 MB XML file may consume 300–500 MB of RAM due to object overhead.
- **Streaming parsing** (`XMLReader`): Memory usage remains roughly constant, determined by the depth of the current parsing path and any buffers you maintain. A 10 GB file can be processed with <50 MB of RAM if you process and discard nodes promptly.

The `XMLReader` will pause reading when downstream consumers cannot keep up, preventing memory buildup.

### 2.3 XML nodes, events, and the document model

#### The `XMLNode` abstraction

Whether produced by `XMLParser` or yielded by `XMLReader`, an `XMLNode` represents a single XML construct. Key properties include:

```javascript
{
  nodeType: 'element',        // 'element', 'text', 'comment', 'cdata', etc.
  localName: 'product',       // Element name without namespace prefix
  namespaceURI: 'http://...', // Full namespace identifier (or null)
  prefix: 'ns',               // Namespace prefix used in source (or null)
  attributes: AttributesMap,  // Map-like object for attribute access
  namespaces: NamespacesMap,  // In-scope namespace declarations
  children: [XMLNode],        // Child nodes (for element types)
  textContent: string,        // Concatenated text of all child text nodes
  parent: XMLNode | null      // Reference to parent (may be null in streaming)
}
```

#### Navigating the tree

```javascript
// Find first child element with localName 'price'
const priceNode = doc.children.find(c => c.localName === 'price');

// Access attribute safely
const currency = priceNode?.attributes?.currency ?? 'USD';

// Get text content
const amount = priceNode?.textContent?.trim();
```

In streaming mode (`XMLReader`), the `parent` reference may be `null` for performance reasons, and `children` may be empty if you have not configured the reader to collect them. Always check the reader's configuration when relying on tree structure.

#### Events vs. nodes

Under the hood, parsing produces `SAXEvent` objects:

```javascript
{
  type: 'startElement',  // 'endElement', 'characters', 'comment', etc.
  localName: 'product',
  attributes: AttributesMap,
  namespaces: NamespacesMap,
  // ... other event-specific fields
}
```

You typically interact with `SAXEvent` only when using `XMLLexer` directly for maximum control. Most applications will work with `XMLNode` instances, which provide a more convenient, tree-oriented API.

### 2.4 Namespaces and attributes handling

#### Namespaces: explicit and scoped

XML namespaces prevent naming conflicts but add complexity. `node-xml-toolkit` handles them explicitly:

```xml
<catalog xmlns="http://example.com/products"
         xmlns:tax="http://example.com/tax">
  <product id="101">
    <tax:rate>0.08</tax:rate>
  </product>
</catalog>
```

```javascript
const doc = parser.process(xml);

const product = doc.children[0];
console.log(product.namespaceURI); // 'http://example.com/products'
console.log(product.localName);    // 'product'

const taxRate = product.children.find(
  c => c.localName === 'rate' && c.namespaceURI === 'http://example.com/tax'
);
```

#### The `NamespacesMap` and `AttributesMap` helpers

Both namespaces and attributes are exposed via Map-like interfaces that support convenient access:

```javascript
// Attributes: direct property access or Map methods
const id = node.attributes.id;
const hasDiscount = node.attributes.has('discount');

// Namespaces: resolve prefix to URI, or URI to prefix
const taxUri = node.namespaces.get('tax'); // 'http://example.com/tax'
const prefix = node.namespaces.getPrefix('http://example.com/tax'); // 'tax'
```

When serializing, the toolkit preserves namespace declarations and prefixes as needed to produce valid, well-scoped XML.

#### Default namespaces and inheritance

Child elements inherit the default namespace of their parent unless overridden:

```javascript
// In the example above, <product> inherits xmlns="http://example.com/products"
// So its namespaceURI is set automatically, even though the source XML
// does not repeat the xmlns attribute on <product>.
```

Be mindful of this when filtering or matching elements by namespace in large documents.

### 2.5 Schema-aware vs. schema-less workflows

`node-xml-toolkit` supports both validation-driven and flexible, schema-less processing.

#### Schema-less: rapid prototyping and permissive parsing

By default, the toolkit parses any well-formed XML without requiring a schema. This is ideal for:

- Exploratory data analysis
- Integrating with loosely specified external feeds
- Prototyping before formalizing data contracts

```javascript
const doc = parser.process(xml); // No schema needed
const value = doc.children[0].textContent;
```

#### Schema-aware: validation and structured serialization

When you have an XML Schema (XSD), you can enable validation and leverage schema information for safer, more predictable processing:

```javascript
const { XMLSchemata, XMLParser } = require('xml-toolkit');

const schemata = new XMLSchemata();
schemata.addFromFile('catalog.xsd');

const parser = new XMLParser({ schemata });
const doc = parser.process(xml); // Throws if XML violates the schema
```

**Benefits of schema-aware workflows:**
- Catch data errors early, before they propagate through your application
- Enable `XMLMarshaller` to generate schema-compliant XML from JavaScript objects
- Provide clearer error messages with line/column information
- Document expected structure for team members and tools

**When to skip validation:**
- Processing trusted internal data where schema enforcement is handled elsewhere
- Performance-critical paths where validation overhead is unjustified
- Working with heterogeneous or evolving external formats where strict validation would block progress

---

Understanding these core concepts—parsing modes, streaming architecture, the node model, namespace handling, and schema integration—provides the mental framework needed to use `node-xml-toolkit` effectively. The remaining chapters build on this foundation with concrete patterns and real-world examples.

# Part II: Reading XML

## 3. The Synchronous Parser: XMLParser

The `XMLParser` is the entry point for developers who need straightforward, blocking XML parsing. It consumes an entire XML document and returns a complete in-memory tree of `XMLNode` objects. This chapter covers when to choose it, how to load and parse documents, how to navigate the resulting structure, how to attach schema validation, and how to handle errors effectively.

### 3.1 When to use XMLParser

`XMLParser` is designed for simplicity and developer ergonomics. It shines in scenarios where:

- **Document size is predictable and moderate**: Typically under 50 MB, though the exact threshold depends on your application's memory budget and Node.js heap configuration.
- **You need random access**: After parsing, you can traverse the tree in any direction, query arbitrary paths, or serialize the document multiple times without re-reading the source.
- **Synchronous code flow is acceptable**: CLI tools, build scripts, configuration loaders, and test utilities often benefit from synchronous APIs that avoid `async`/`await` boilerplate.
- **You prefer a document-centric model**: When your business logic operates on the XML as a whole (e.g., diffing documents, extracting metadata, transforming structure), a full tree representation simplifies implementation.

**Avoid `XMLParser` when:**
- Processing unbounded or multi-gigabyte files from untrusted sources
- Building high-throughput HTTP endpoints where memory spikes could trigger garbage collection pauses
- Implementing streaming transformations or pipelines that must process records as they arrive

In those cases, `XMLReader` (covered in Chapter 4) is the appropriate tool.

### 3.2 Loading and parsing small to medium files

The synchronous parser accepts strings, Buffers, or file paths. It reads the entire input before constructing the document tree.

### Basic usage with a string

```javascript
const { XMLParser } = require('xml-toolkit');

const xml = `
  <settings>
    <database host="localhost" port="5432"/>
    <logging level="info"/>
  </settings>
`;

const parser = new XMLParser();
const doc = parser.process(xml);
// const obj = XMLNode.toObject({ wrap: true })(doc)

console.log(doc.localName); // settings
```

> **Tip**: at this point, it's a good idea to take a look on the section "Mapping XML Nodes to Plain Objects" unless you are familiar with the matter.

### Parsing from a file

For file-based workflows, combine `XMLParser` with Node.js synchronous file reading:

```javascript
const fs = require('fs');
const { XMLParser } = require('xml-toolkit');

const xmlBuffer = fs.readFileSync('config.xml');
const parser = new XMLParser();
const doc = parser.process(xmlBuffer);
// const obj = XMLNode.toObject({ wrap: true })(doc)
```

### Parser configuration options

`XMLParser` accepts an optional configuration object during instantiation:

```javascript
const parser = new XMLParser({
  stripSpace:    true,     // .trim() all text nodes' content
  useEntities:   true      // support entities, including '&amp;', '&quot;' etc.
  useNamespaces: true,     // enable namespace resolution
  xs:        undefined     // XML Schema to validate against, see below
});
```

Altering `useNamespaces` and especially `useEntities` is highly discouraged. Just never touch then unless you are totally sure.

### 3.3 Navigating the parsed document tree

The result of `parser.process()` is a root `XMLNode` representing the document element. From there, you traverse the tree using standard array methods and node properties.

### Finding elements

```javascript
// Find the first <database> child
const dbNode = doc.children.find(node => node.localName === 'database');

// Find all <logging> elements anywhere in the tree (recursive)
function findAll(node, name) {
  const matches = [];
  if (node.localName === name) matches.push(node);
  for (const child of node.children || []) {
    matches.push(...findAll(child, name));
  }
  return matches;
}

const allLogNodes = findAll(doc, 'logging');
```

> **Note**: `node-xml-toolkit` does not include a built-in XPath evaluator. For complex queries, implement targeted recursive helpers or use `XMLNode.toObject()` for JSON-based filtering.

### Working with attributes

Attributes are exposed via an `AttributesMap` instance subclassing [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map):

```javascript
const dbHost = dbNode.attributes.get('host'); // "localhost"

// Check existence
if (dbNode.attributes.has('ssl')) {
  console.log('SSL enabled:', dbNode.attributes.get('ssl'));
}
```

Attribute values are always strings. When necessary, convert them explicitly:

```javascript
const port = parseInt(dbNode.attributes.get('port'), 10);
const ssl = dbNode.attributes.get('ssl') === 'true';
```

### Extracting text content

`node.innerText` concatenates all child text and CDATA nodes:

```javascript
const config = `
  <title>
    Application <![CDATA[Server]]>
  </title>
`;
const doc = new XMLParser({stripSpace: true}).process(config);
console.log(doc.innerText); // "Application Server"
```

### Converting to plain objects

For seamless integration with most JavaScript code, use `XMLNode.toObject()` that flattens the tree into a JSON-compatible structure:

```javascript
const plain = XMLNode.toObject()(doc);

console.log(JSON.stringify(plain, null, 2));
/*
{
  "settings": {
    "database": {"host": "localhost", "port": "5432"},
    "logging": {"level": "info"}
  }
}
*/
```

### 3.4 Optional validation with XMLSchemata

Validation is not required for parsing, but it dramatically improves data reliability when working with external or user-supplied XML.

### Loading schemas

```javascript
const { XMLSchemata, XMLParser } = require('xml-toolkit');
const schemata = new XMLSchemata('schemas/catalog.xsd');
```

`XMLSchemata` source is loaded during the constructor execution. So HTTP and other asynchronous network sources are not supported; `<xs:import>` and `<xs:include>` elements only work when referencing local files.

### Attaching validation to the parser

Pass the schemata instance during parser construction:

```javascript
const parser = new XMLParser({ xs: schemata });

try {
  const doc = parser.process(fs.readFileSync('product-feed.xml'));
  if (parser.validationMessages.length > 0) {
    for (const msg of parser.validationMessages) {
      console.warn(msg) // e.g., "XVS-00004 The value 'abc' has the length 3, which exceeds the allowed maximum of 2"
    }
  }
  else {
    console.log('Document is valid and fully parsed.');
  }

} catch (err) {
  // Parsing stops at the first validation or well-formedness error
  console.error('Invalid document:', err.message);
}
```

### 3.5 Error handling and diagnostics

`XMLParser` adopts a resilient approach to error handling: parsing and validation issues do not halt execution by default. Instead, diagnostics are collected in the `validationMessages` array, allowing your application to decide whether to treat issues as warnings, recoverable errors, or fatal failures. This design enables graceful degradation when processing partially invalid documents or when schema validation is optional.

> **Version note**: Prior to v1.1.6, validation errors caused `process()` to throw immediately ("fail fast"). Starting with v1.1.6, all diagnostics are collected in `parser.validationMessages` and parsing continues unless a well-formedness error occurs.

### 3.5.1 The `validationMessages` property

After calling `parser.process(xml)`, inspect `parser.validationMessages` to retrieve any issues encountered:

```javascript
const { XMLParser, XMLSchemata } = require('xml-toolkit')

const xml = fs.readFileSync('data.xml', 'utf8')
const xs = new XMLSchemata('schema.xsd')
const parser = new XMLParser({ xs })

const doc = parser.process(xml)

// Always check for messages after process()
if (parser.validationMessages.length > 0) {
  for (const msg of parser.validationMessages) {
    console.warn(msg) // e.g., "XVS-00004 The value 'abc' has the length 3, which exceeds the allowed maximum of 2"
  }
}
```

#### Message format

Each entry in `validationMessages` is a formatted string following this pattern:

```
<CODE> <formatted message>
```

Where `<CODE>` is one of the predefined identifiers from `lib/XMLMessages.js`:

| Prefix | Scope | Examples |
|--------|-------|----------|
| `XML-` | Well-formedness / structural issues | `XML-00001`, `XML-00002`, `XML-00003` |
| `XSD-` | Schema discovery / namespace issues | `XSD-00001`, `XSD-00002` |
| `XVC-` | Validation: content model violations | `XVC-00001` … `XVC-00005` |
| `XVS-` | Validation: simple type / value constraints | `XVS-00001` … `XVS-00041` |

#### Common error codes

**Structural / well-formedness (`XML-*`)**
- `XML-00001`: `maxLength=%i exceeded` — internal buffer limit hit during parsing
- `XML-00002`: `Unbalanced end element` — mismatched closing tag
- `XML-00003`: `Unmatched end element, </${ %s }> expected` — unexpected closing tag name

**Schema discovery (`XSD-*`)**
- `XSD-00001`: `Unknown namespace: %s` — element references an undeclared namespace
- `XSD-00002`: `The element %s is not found in %s` — element not defined in schema

**Content model violations (`XVC-*`)**
- `XVC-00001`: `No nested elements allowed inside %s` — simple type element contains children
- `XVC-00002`: `is unexpected here; should be %s` — element order violates schema sequence
- `XVC-00003`: `Unknown attribute: %s` — attribute not declared in schema
- `XVC-00004`: `The attribute "%s" must have the value "%s", not "%s"` — fixed attribute value mismatch
- `XVC-00005`: `Missing required attribute: "%s"` — required attribute absent

**Value constraints (`XVS-*`)**
- `XVS-00001`/`00002`: Pattern mismatch (single/multiple patterns)
- `XVS-00003`: Value not in enumeration list
- `XVS-00004`/`00005`/`00006`: String length violations (max/min/exact)
- `XVS-00007`–`00010`: Numeric range violations (less/greater than thresholds)
- `XVS-00011`/`00012`: Boolean parsing failures
- `XVS-00013`–`00019`: Decimal/number format and precision errors
- `XVS-00020`/`00021`: Floating-point parsing failures
- `XVS-00022`–`00041`: Date/time format, component, and timezone validation errors

> **Tip**: Use the error code prefix to categorize issues programmatically:
> ```javascript
> const errors = parser.validationMessages.filter(m => m.startsWith('XVC-') || m.startsWith('XVS-'))
> const warnings = parser.validationMessages.filter(m => m.startsWith('XML-'))
> ```

----

### 3.5.2 Distinguishing fatal vs. recoverable errors

Not all messages are equal. Some indicate malformed XML that cannot be reliably processed; others are schema warnings that may be acceptable in your context.

#### Fatal: well-formedness errors

Errors with `XML-` codes typically indicate broken XML structure. These should usually halt processing:

```javascript
function isFatal(msg) {
  return msg.startsWith('XML-00002') || msg.startsWith('XML-00003')
}

const doc = parser.process(xml)

const fatal = parser.validationMessages.filter(isFatal)
if (fatal.length > 0) {
  throw new Error(`Unrecoverable XML errors: ${fatal.join('; ')}`)
}

// Proceed with non-fatal messages logged or handled separately
```

#### Recoverable: schema validation issues

`XVC-*` and `XVS-*` messages indicate schema mismatches. Depending on your use case, you may:
- Log and continue (for lenient ingestion pipelines)
- Reject the document (for strict validation gates)
- Attempt auto-correction (for known, fixable patterns)

```javascript
// Example: reject only on missing required attributes
const missingRequired = parser.validationMessages
  .filter(m => m.startsWith('XVC-00005'))

if (missingRequired.length > 0) {
  console.error('Missing required attributes:', missingRequired)
  return null // or throw, or return error envelope
}

// Log other warnings but continue
const otherWarnings = parser.validationMessages
  .filter(m => !missingRequired.includes(m))
if (otherWarnings.length > 0) {
  console.warn('Schema warnings (ignored):', otherWarnings)
}
```

### 3.5.4 When parsing fails entirely

While validation messages are collected non-fatally, certain conditions still cause `process()` to throw:

- **Invalid UTF-8 or encoding mismatches** in the input string
- **Extremely malformed XML** that breaks the underlying lexer (e.g., unclosed quotes in attributes)
- **Internal buffer limits** (rare; configurable at build time)

These cases are not represented in `validationMessages`. Wrap `process()` in a try/catch for robust error boundaries:

```javascript
try {
  const doc = parser.process(xml)
  // Handle validationMessages as shown above
} catch (err) {
  // Lexical/encoding/internal errors
  console.error('Parser failure:', err.message)
  // Consider returning a standardized error envelope
}
```
## 4. The Asynchronous Parser: XMLReader

While `XMLParser` offers simplicity for small documents, real-world enterprise integrations rarely fit comfortably into memory. `XMLReader` is the streaming counterpart that processes XML incrementally, yielding nodes as they are encountered. This chapter explains when to choose it, how to configure it for efficient data extraction, and how to integrate it into both pull-based and push-based Node.js workflows.

### 4.1 When to use XMLReader

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

### 4.2 Configuring filters and mappers

To avoid yielding every single node in a large document, `XMLReader` supports declarative filtering and transformation during instantiation.

#### Basic configuration

```javascript
const { XMLReader } = require('xml-toolkit');
const fs = require('fs');

const reader = new XMLReader({
  // filter      : node    => node.type === 'EndElement' && node.level === 1,
  filterElements : element => element.level === 1,
  map            : XMLNode.toObject ({}),
}).process (fs.createReadStream('large-export.xml', { encoding: 'utf8' }));
```

#### The `filter` / `filterElements` option
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

#### The `map` function
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

### 4.3 Pull mode: iterating with for-await-of

Being a subclass of [`Readable`](https://nodejs.org/docs/latest/api/stream.html#readable-streams), `XMLReader` implements the [`AsyncIterable`](https://tc39.es/ecma262/#sec-asynciterable-interface) protocol, making [`for await...of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of) available:

#### Basic iteration

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

#### Early termination

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

### 4.4 Push mode: event listeners and streams

While pull mode is preferred for modern JavaScript, `XMLReader` also exposes a traditional event emitter interface for compatibility with legacy codebases or complex stream orchestration.

#### Event-based consumption

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

### 4.5 Combining with Node.js streams pipeline

`XMLReader` seamlessly integrates with Node.js `stream.pipeline` API, enabling robust, error-handled data flows that respect backpressure across all components.

#### Pipeline example: XML to CSV conversion

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

#### Why pipelines matter
- **Automatic backpressure**: If the CSV writer slows down (e.g., disk I/O bottleneck), the pipeline pauses the `XMLReader`, which pauses the underlying file stream. Memory remains bounded.
- **Centralized error handling**: A single `try/catch` around `pipeline()` captures errors from any stage.
- **Resource cleanup**: On completion or error, all streams are automatically closed and file descriptors released.

#### Error handling in pipelines

```javascript
try {
  await pipeline(/* streams */);
} catch (err) {
  // err.cause contains the original error from the failing stage
  console.error('Pipeline failed at:', err.cause?.constructor?.name);
  console.error('Message:', err.message);
}
```

#### Parallel processing considerations
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

### 4.5 Error handling and diagnostics

`XMLReader` handles errors differently from `XMLParser` due to its streaming, event-driven architecture. While validation message codes and formats are identical to those documented above, the delivery mechanism and recovery strategies differ significantly.

#### 4.5.1 Stream-level errors: the `error` event

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

##### Key behaviors

- **Automatic destruction**: When the internal `XMLLexer` emits an `error`, `XMLReader` calls `this.destroy(err)`, terminating the stream and preventing further `data` events [[source]].
- **Async iteration safety**: `for-await-of` loops handle stream errors gracefully—the loop exits and the error is available via the `error` event handler.
- **No recovery**: Unlike validation messages (see below), stream-level errors are fatal. The document cannot be partially processed once the lexer fails.

> ⚠️ **Always attach an `error` handler before calling `process()`**. Unhandled stream errors may crash your Node.js process.


### 4.5.2 Schema validation: the `validation-message` event

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

## 5. Mapping XML Nodes to Plain Objects

Converting XML to plain JavaScript objects is a frequent requirement when integrating with modern APIs, databases, or frontend frameworks. `node-xml-toolkit` provides a focused utility for this task: `XMLNode.toObject()`, powered internally by the `MoxyLikeJsonEncoder` module.

> **Clarification**: Despite its name, `XMLNode.toObject()` is not an instance method on `XMLNode`. It is a standalone function exported for convenience, designed primarily to serve as a mapper function for `XMLReader`.

### 5.1 Purpose and Design Philosophy

`XMLNode.toObject()` transforms an `XMLNode` tree into a plain, `JSON.stringify`-ready JavaScript object. Its design prioritizes:

- **Simplicity**: Minimal options, predictable output.
- **Streaming compatibility**: Returns a function suitable for `XMLReader`'s `map` option.
- **Data-processing focus**: Merges attributes with child elements; does not preserve document order or mixed content.

It is **not** intended for general-purpose XML transformation tasks where namespace fidelity, processing instructions, or exact node ordering matter. For those cases, work directly with `XMLNode` methods like `detach()` or traverse the tree manually.

The historical name of an internal class `MoxyLikeJsonEncoder` reflects that the core behavior draws loose inspiration from [EclipseLink MOXy](https://eclipse.dev/eclipselink/#moxy)'s JSON binding conventions—but it is a lightweight, independent implementation with its own rules.

### 5.2 Usage Pattern

#### Direct invocation on a parsed node

```javascript
const { XMLParser, XMLNode } = require('xml-toolkit')

const parser = new XMLParser()
const doc = parser.process('<root><item id="1">value</item></root>')

const result = XMLNode.toObject({ wrap: true })(doc)
// result: { root: { item: { id: "1", "#text": "value" } } }
```

#### As a mapper for XMLReader

```javascript
const { XMLReader, XMLNode } = require('xml-toolkit')

const reader = new XMLReader({
  stripSpace: true,
  collect: e => true,
  filterElements: 'MessagePrimaryContent',
  map: XMLNode.toObject({
    // options here
  })
})

for await (const obj of reader.process(stream)) {
  // obj is a plain JavaScript object
  console.log(obj)
}
```

> Note: When used directly, `XMLNode.toObject(options)` returns a function that accepts an `XMLNode` and returns the transformed object.

### 5.3 Options Reference

| Option | Default | Description |
|--------|---------|-------------|
| `wrap` | `false` | If `true`, output includes the root element name as a top-level key: `{ RootName: {...} }`. If `false` (default), only the content object is returned. |
| `getName` | `(localName, namespaceURI) => localName` | Function to transform XML element/attribute names into JavaScript object keys. Receives `localName` and `namespaceURI`; returns the desired property name. |
| `map` | `undefined` | If provided, a function applied to each resulting object (similar to `Array.prototype.map`). Useful for adding computed fields or normalizing structure. |

### 5.4 Transformation Rules

#### Top-level element handling

By default, the root element's name is omitted from the output:

```xml
<MyElement><value>42</value></MyElement>
```

```javascript
// wrap: false (default)
→ { value: "42" }

// wrap: true
→ { MyElement: { value: "42" } }
```

This default avoids redundant wrapping when the root name is a known constant in your application logic.

#### Attributes

Attributes become direct key-value pairs on the element's content object. Values are always strings (no automatic type coercion):

```xml
<Item id="123" status="active"/>
```

```javascript
→ { id: "123", status: "active" }
```

#### Text content

If an element contains only text (no attributes or child elements), the result is the trimmed string value:

```xml
<Name>John Doe</Name>
```

```javascript
→ "John Doe"
```

> ⚠️ **Limitation**: Elements that mix text content with attributes or child elements cannot be represented unambiguously. The encoder does not support mixed content; such structures may produce unexpected results.

#### Child elements: singletons vs. collections

- **Multiple same-name children** → array:
  ```xml
  <List><item>A</item><item>B</item></List>
  ```
  ```javascript
  → { item: ["A", "B"] }
  ```

- **Single child element** → scalar value:
  ```xml
  <User><id>42</id></User>
  ```
  ```javascript
  → { id: "42" }
  ```

- **Schema-aware arrays**: If the XML was parsed with schema context and an element is declared with `maxOccurs > 1`, it is always represented as an array—even if only one instance appears:
  ```xml
  <!-- Schema: <xsd:element name="tag" maxOccurs="unbounded"/> -->
  <Data><tag>only-one</tag></Data>
  ```
  ```javascript
  → { tag: ["only-one"] }
  ```

#### Scalar values and null handling

- All leaf values are either `null` or trimmed, non-empty strings.
- Empty strings (`""`) are converted to `null`:
  ```xml
  <Field value=""/>
  ```
  ```javascript
  → { value: null }
  ```
- Empty elements (`<Empty/>` or `<Empty></Empty>`) yield `null`:
  ```javascript
  // wrap: false
  → null
  // wrap: true
  → { Empty: null }
  ```
- No automatic parsing of numbers, booleans, or dates occurs. `"42"` remains a string; `"true"` remains a string.

#### Namespace handling

By default, namespaces are ignored: only the local name is used for object keys:

```xml
<x:Product x:code="XYZ" xmlns:x="urn:example"/>
```

```javascript
→ { code: "XYZ" }  // namespace URI and prefix discarded
```

To preserve namespace information, customize the `getName` option:

```javascript
XMLNode.toObject({
  getName: (localName, namespaceURI) => 
    namespaceURI ? `{${namespaceURI}}${localName}` : localName
})
```

```javascript
→ { "{urn:example}code": "XYZ" }
```

### 5.5 Practical Examples

#### Example 1: Extracting a flat record list

```xml
<Export>
  <Record id="1" name="Alpha"/>
  <Record id="2" name="Beta"/>
</Export>
```

```javascript
const { XMLReader, XMLNode } = require('xml-toolkit')

const records = new XMLReader({
  filterElements: 'Record',
  map: XMLNode.toObject() // default: no wrap, attributes merged
})

for await (const rec of records.process(fs.createReadStream('data.xml'))) {
  // rec = { id: "1", name: "Alpha" }
  console.log(rec)
}
```

#### Example 2: Adding a computed field via `map`

```javascript
const mapper = XMLNode.toObject({
  map: obj => ({ ...obj, processedAt: new Date().toISOString() })
})

const result = mapper(parsedNode)
// { id: "1", name: "Alpha", processedAt: "2026-04-24T..." }
```

#### Example 3: Preserving element names with `wrap`

```javascript
const mapper = XMLNode.toObject({ wrap: true })

const result = mapper(parsedNode)
// { Record: { id: "1", name: "Alpha" } }
```

Useful when the element name carries semantic meaning that should travel with the data.

#### Example 4: Normalizing names with `getName`

```javascript
const mapper = XMLNode.toObject({
  getName: (localName) => localName.toLowerCase()
})

// Input: <UserProfile><FirstName>Ada</FirstName></UserProfile>
// Output: { firstname: "Ada" }
```

## 6. Practical Reading Patterns

This chapter presents some basic patterns for using `XMLParser` and `XMLReader` in typical application tasks.

### 6.1 Slurping a whole document

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

### 6.2 Extracting a single element

Suppose you need to locate one piece of data in an XML document. The optimal approach depends on document size and your latency tolerance.

#### Synchronous approach for small files

For configuration files, small messages etc. this problem is a trivial particular case of thre previuos one:

```javascript
const { XMLParser } = require('xml-toolkit');
const fs = require('fs');

const {version} = XMLNode.toObject({wrap: true})(
  (new XMLParser()).process (fs.readFileSync('manifest.xml', 'utf8'))
);

console.log (version);
```

#### Asynchronous approach: `XMLReader.findFirst()`

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

### 6.3 Reading a record list

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

# Part III: Writing XML

## 7. Generating Well Formed XML with XMLPrinter

This chapter covers the two primary components in `node-xml-toolkit` for generating well-formed XML: `XMLPrinter` and `XMLStreamPrinter`. Both provide a fluent, chainable API for constructing XML documents programmatically. The choice between them depends on the size of your output and memory constraints.

### 7.1 Choosing the Right Printer

| Component | Use Case | Memory Model | Output Destination |
|-----------|----------|--------------|-------------------|
| `XMLPrinter` | Small to medium XML fragments (e.g., isolated elements, config snippets) | Accumulates entire output in `.text` property (in-memory string) | Returns complete string via `.text` |
| `XMLStreamPrinter` | Large documents, streaming to files/network, memory-constrained environments | Writes directly to a Writable stream; no in-memory accumulation | Requires `out` option: a Node.js `stream.Writable` |

**Rule of thumb**: Use `XMLPrinter` when the entire XML output fits comfortably in memory. Use `XMLStreamPrinter` when generating large documents, writing to files, or integrating with HTTP responses.

### 7.2 Common Configuration Options

Both printers accept the same constructor options. All are optional:

| Option | Default | Description |
|--------|---------|-------------|
| `decl` | `undefined` | If set, automatically writes an XML declaration (`<?xml ...?>`) with the provided `encoding` and `standalone` values |
| `space` | `undefined` | Indentation for pretty-printing. Accepts a string (e.g., `'\t'`) or a number (repeated spaces, e.g., `2` → `'  '`). If unset, output is minified (single-line) |
| `attrSpace` | `undefined` | Additional indentation for attributes. When set, each attribute appears on its own line, indented relative to the opening tag |
| `EOL` | `os.EOL` | Line ending string. Only relevant when `space` is set |
| `level` | `0` | Initial indentation level (number of `space` units to prepend) |
| `encodeLineBreaks` | `true` | When `true`, replaces `\n` and `\r` in text/attributes with numeric entities (`&#10;`, `&#13;`) for well-formedness |

#### Example: Pretty-printed output with custom indentation

```javascript
const {XMLPrinter} = require('xml-toolkit');

const xp = new XMLPrinter({
  space: 2,              // 2-space indentation
  attrSpace: '  ',       // Attributes on new lines, indented 2 extra spaces
  decl: { encoding: 'UTF-8' } // Auto-write XML declaration
});
```

### 7.3 Core API: Low-Level Methods

Both printers expose the same chainable methods. Each returns `this` to enable fluent composition.

#### `reset()`

(`XMLPrinter` only) Resets internal state: clears accumulated text, empties the element stack, and applies the `decl` option if present. Called automatically by the constructor.

#### `writeXMLDecl({encoding, standalone})`

Writes an XML declaration. Must be called before any elements. The `standalone` value is normalized: truthy → `'yes'`, falsy → `'no'`.

```javascript
xp.writeXMLDecl({ encoding: 'UTF-8', standalone: true });
// Output: <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
```

#### `openElement(name)`

Begins an element: writes `<${name}` and marks the tag as "open" for attribute appending. Pushes `name` onto the internal stack.

#### `writeAttribute(name, value)`

Appends an attribute to the currently open element. Both `name` and `value` must be strings. Values are automatically escaped for XML attribute context.

```javascript
xp.openElement('item')
  .writeAttribute('id', '123')
  .writeAttribute('status', 'active & pending');
// Output: <item id="123" status="active &amp; pending"
```

#### `writeCharacters(value)`

Writes text content with automatic escaping for XML character data (`<`, `>`, `&`, `"`, and—optionally—line breaks).

```javascript
xp.writeCharacters('5 < 10 && 3 > 1');
// Output: 5 &lt; 10 &amp;&amp; 3 &gt; 1
```

#### `writeBody(value)`

Writes raw XML content *without* escaping. Use only when `value` is a pre-validated, well-formed XML fragment (e.g., for embedding `xs:any` content). Throws if called outside an element context.

#### `closeElement()`

Closes the most recently opened element. If no content was added, emits a self-closing tag (`<name />`); otherwise, emits `</name>`. Pops the element name from the internal stack.

### 7.4 Convenience Method: `writeNode(node)`

For cases where you already have a structured representation generated by `XMLParser` or `XMLReader`, `writeNode` recursively serializes an `XMLNode` object:

- Handles element names, attributes, and child nodes
- Automatically emits necessary `xmlns` and `xmlns:prefix` declarations if the node includes a `namespacesMap`
- Escapes text content appropriately

```javascript
// Assuming `node` is an XMLNode instance from xml-toolkit's parser
xp.writeNode(node);
```

> **Note**: Namespace consistency is the caller's responsibility unless using `writeNode`, which inspects `namespacesMap`.

### 7.5 Using XMLPrinter: In-Memory Generation

`XMLPrinter` accumulates output in the `.text` property. This is convenient for small outputs but risks memory exhaustion for large documents.

#### Basic Example

```javascript
const {XMLPrinter} = require('xml-toolkit');

const xp = new XMLPrinter({ space: 2 });

const xml = xp
  .openElement('catalog')
    .writeAttribute('updated', '2026-04-24')
    .openElement('product')
      .writeAttribute('id', 'p1')
      .openElement('name')
        .writeCharacters('Widget')
      .closeElement()
      .openElement('price')
        .writeCharacters('19.99')
      .closeElement()
    .closeElement()
  .closeElement()
  .text;

console.log(xml);
```

#### Reusing a Printer Instance

Call `reset()` to clear state and reuse the same instance for multiple independent fragments:

```javascript
const xp = new XMLPrinter({ space: 2 });

// First fragment
const frag1 = xp.openElement('a').writeCharacters('x').closeElement().text;

// Reset and generate another
xp.reset();
const frag2 = xp.openElement('b').writeCharacters('y').closeElement().text;
```

### 7.6 Using XMLStreamPrinter: Streaming to a Destination

`XMLStreamPrinter` writes directly to a Node.js `Writable` stream. It does not accumulate output in memory and does not expose a `.text` property.

#### Basic Example: Writing to a File

```javascript
const fs = require('node:fs');
const {XMLStreamPrinter} = require('xml-toolkit');

const out = fs.createWriteStream('output.xml');
const xp = new XMLStreamPrinter({ out, space: 2 });

xp
  .openElement('report')
    .openElement('summary')
      .writeCharacters('Q1 2026 results')
    .closeElement()
  .closeElement();

out.end(); // Finalizes the stream
```

#### Stream Lifecycle Notes

- The printer monitors the destination stream's `drain` event to apply backpressure automatically.
- The printer exposes `.destroy(err)` and `.end()` getters that delegate to the underlying stream.

#### Advanced: Integrating with Transform Streams

`XMLStreamPrinter` supports controlled streaming via its `forEach(stream, onData)` method (experimental). This allows pausing/resuming the input stream based on destination readiness. Nested streams are not yet supported.

---

### 7.7 Escaping and Well-Formedness Guarantees

Both printers enforce XML well-formedness through automatic escaping:

- **Attribute values**: `"` → `&quot;`, `<` → `&lt;`, `>` → `&gt;`, `&` → `&amp;`, and (by default) line breaks → `&#10;`/`&#13;`
- **Character data**: Same as above, except `"` is not escaped
- **Line break handling**: Controlled by `encodeLineBreaks`. Set to `false` only if you guarantee input contains no unescaped line breaks in contexts where they would break well-formedness

> **Critical**: All `value` arguments to `writeAttribute` and `writeCharacters` must be strings. Numbers, `null`, `undefined`, or objects will throw. Convert explicitly: `String(value)` or format properly.

### 7.8 Namespaces: Practical Guidance

The low-level API treats element and attribute names as opaque strings. You may include colons (e.g., `'xsi:type'`) manually:

```javascript
xp.openElement('root')
  .writeAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
  .writeAttribute('xsi:schemaLocation', '...')
  .openElement('xsi:item') // Prefix used directly
  .closeElement()
.closeElement();
```

For automatic namespace declaration handling, use `writeNode(node)` with a node that includes a `namespacesMap` (a `Map` of prefix → URI, with an optional `default` property for the default namespace).

### 7.9 Complete Example: Generating a Feed Document

```javascript
const fs = require('node:fs');
const {XMLStreamPrinter} = require('xml-toolkit');

function generateFeed(items, outputPath) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(outputPath);
    const xp = new XMLStreamPrinter({
      out,
      space: 2,
      decl: { encoding: 'UTF-8' }
    });

    xp.openElement('feed')
      .writeAttribute('xmlns', 'http://www.w3.org/2005/Atom');

    for (const item of items) {
      xp.openElement('entry')
        .openElement('title')
          .writeCharacters(item.title)
        .closeElement()
        .openElement('content')
          .writeCharacters(item.body)
        .closeElement()
      .closeElement();
    }

    xp.closeElement(); // Close <feed>
    out.on('finish', resolve);
    out.on('error', reject);
    out.end();
  });
}

// Usage
generateFeed([
  { title: 'First Post', body: 'Hello & welcome!' },
  { title: 'Second Post', body: 'More content <here>' }
], 'feed.xml')
.then(() => console.log('Done'))
.catch(console.error);
```

## 8. Schema-Driven Serialization with XMLMarshaller

Generating XML from JavaScript objects is a common requirement in API clients, message brokers, and data export pipelines. However, producing structurally valid XML manually is error-prone. `XMLMarshaller` bridges this gap by using XML Schema (XSD) definitions to automatically transform plain JavaScript objects into well-formed, schema-compliant XML documents. This chapter covers schema loading, object mapping strategies, namespace handling, and troubleshooting techniques.

### 8.1 Loading and indexing XML Schema definitions

`XMLMarshaller` relies on `XMLSchemata` to understand the target structure, data types, and cardinality constraints. Proper schema management is the foundation of reliable serialization.

```javascript
const { XMLSchemata, XMLMarshaller } = require('xml-toolkit');
const schemata = new XMLSchemata('schemas/order.xsd');
```

Schema parsing and type resolution have upfront costs. In long-running applications (HTTP servers, workers, CLI tools processing multiple files), reuse a single `XMLSchemata` instance:

```javascript
// Application initialization
const globalSchemata = new XMLSchemata('schemas/order.xsd');

// Route handler or worker function
function someHandler() {
  const marshaller = globalSchemata.createMarshaller(
    'Order'                       // localName
    // , 'http://tempuri.org/'    // namespace URI, if available
  )
  // use the `marshaller` instance in this scope
}
```

This avoids redundant parsing, reduces startup latency, and ensures consistent type coercion across your application.

### 8.2 Mapping JavaScript objects to schema-compliant XML

The core challenge in XML serialization is the structural mismatch between JavaScript objects and XML trees. `XMLMarshaller` uses a deterministic mapping algorithm that interprets object keys as element names, handles arrays for repeated elements, and applies a convention for attributes.

#### Basic object structure convention

```javascript
const marshaller = new XMLMarshaller({ schemata });

const orderData = {
  id: 'ORD-9921',
  status: 'pending',
  customer: {
    name: 'Acme Corp',
    contact: 'ops@acme.example.com'
  },
  items: [
    { sku: 'WDG-01', quantity: 5, unitPrice: 12.50 },
    { sku: 'WDG-02', quantity: 2, unitPrice: 45.00 }
  ]
};

const xml = marshaller.stringify(orderData);
```

#### How the mapper interprets objects

| JavaScript construct | XML mapping behavior |
|----------------------|----------------------|
| String/Number/Boolean | Converted to text content of the enclosing element |
| Nested Object | Serialized as a child element |
| Array of Objects/Primitives | Each item becomes a sibling element with the parent key's name |
| `null` / `undefined` | Omitted entirely (when `minOccurs="0"`) or `xsi:nil` (for `nillable` elements) |
| Dates (`Date` objects) | Serialized according to `xs:date` or `xs:dateTime` format rules |

XML distinguishes between child elements and attributes, while JavaScript objects do not which may lead to collisions. On the other hand, a schema allowing element like

```xml
  <object id="1"> <!-- `id` as an attribute -->
    <id>2</id>    <!-- `id` as a child element -->
  </object>
```

seems extremely unlikely to be used in a real application. As of this writing, `XMLMarshaller` does nothing to address this potential issue.

The same logic applies to possible namespace conflicts.

#### Type coercion and validation during marshalling

The marshaller *partially* validates your JavaScript data against the schema before generating XML. Fatal type mismatches are caught early:

```javascript
// Schema expects xs:integer for quantity, but receives a string
const badItem = { sku: 'WDG-01', quantity: 'five', unitPrice: 12.50 };

try {
  marshaller.stringify({ items: [badItem] }, 'Order');
} catch (err) {
  console.error (err)
}
```

It worth bearing in mind that `XMLMarshaller` considers the XML schema as a blueprint for generating text, not as a set of rules to check. This is why validation errors occur only in cases when `XMLMarshaller` have completely no idea how to serrialize a value: say a Boolean as a timestamp. For most non-textual values, the default `String()` conversion is used, so the output may occur to be invalid in ters of the schema. Ultimately, the proper formatting of numbers, dates etc. is left on the developer's responsibility.

# Part IV: Working with SOAP

## 9. SOAP Fundamentals in node-xml-toolkit

The `node-xml-toolkit` library provides first-class support for SOAP web services through dedicated classes that bridge the gap between plain JavaScript objects and the XML-based SOAP protocol. Unlike many Node.js SOAP libraries that wrap external dependencies, `node-xml-toolkit` implements SOAP functionality using its own XML parsing and serialization infrastructure, maintaining the library's core philosophy of minimal dependencies and maximum control.

This section introduces the foundational concepts for working with SOAP in `node-xml-toolkit`, covering WSDL interpretation, version support, and message construction patterns.

### 9.1 WSDL interpretation and service discovery

At the heart of SOAP integration in `node-xml-toolkit` is the ability to parse and interpret WSDL (Web Services Description Language) documents. When you instantiate a `SOAP11` or `SOAP12` client with a WSDL file path, the library performs several discovery steps automatically:

```javascript
const {SOAP11} = require('xml-toolkit')
const soap = new SOAP11('service.wsdl')
```

#### How WSDL parsing works

1. **Schema loading**: The constructor loads the WSDL file using `XMLSchemata`, which parses the document into an internal tree representation of `XMLNode` objects.

2. **Definition extraction**: The library scans the parsed document for `<wsdl:definitions>` elements (namespace `http://schemas.xmlsoap.org/wsdl/`) and stores them in the `definitions` array for later lookup.

3. **Metadata indexing**: Several helper methods enable service discovery without manual XML traversal:

| Method | Purpose | Returns |
|--------|---------|---------|
| `getMessageLocalNameByElementLocalName(elementName)` | Maps a request element name to its containing `<wsdl:message>` | Message name string |
| `getOperationNameByMessageLocalName(messageName)` | Finds the `<wsdl:operation>` that uses a given message | Operation name string |
| `getSoapActionByOperationName(operationName)` | Retrieves the `soapAction` HTTP header value for an operation | SOAPAction string |
| `getSoapActionByElementLocalName(elementName)` | Convenience method: element name → SOAPAction | SOAPAction string |

These methods enable a declarative workflow: you provide a plain JavaScript object keyed by your request element name, and the library automatically determines the correct SOAPAction header and message structure.

#### Service discovery pattern

```javascript
// Given a WSDL with a method accepting <GetUser> elements:
const requestPayload = {GetUser: {userId: '12345'}}
const {method, headers, body} = soap.http(requestPayload)
// headers.SOAPAction is automatically populated from WSDL metadata
```

> **Note**: WSDL parsing in `node-xml-toolkit` focuses on the structural metadata needed for message construction. Advanced WSDL features like complex binding configurations or policy assertions are not fully interpreted—this aligns with the library's "forever beta" stance on XML Schema and WSDL support.

### 9.2 SOAP 1.1 vs. SOAP 1.2 support

`node-xml-toolkit` provides separate classes for each major SOAP version, reflecting their distinct protocol requirements:

#### SOAP 1.1 (`SOAP11` class)

- **Namespace**: `http://schemas.xmlsoap.org/soap/envelope/`
- **Content-Type**: `text/xml; charset=utf-8` [[4]]
- **Fault structure**: Uses `faultcode`, `faultstring`, `faultactor`, and `detail` elements
- **SOAPAction header**: Required; extracted from WSDL `<soap:operation soapAction="...">` or WS-Addressing `Action` attribute [[4]]

#### SOAP 1.2 (`SOAP12` class)

- **Namespace**: `http://www.w3.org/2003/05/soap-envelope`
- **Content-Type**: `application/soap+xml; charset=utf-8` [[4]]
- **Fault structure**: Uses `Code`, `Reason`, `Role`, and `Detail` with nested `Value`/`Text` elements
- **SOAPAction header**: Not required by spec; header management is simplified

#### Version selection

Use the factory helper for dynamic version selection:

```javascript
const {SOAP} = require('xml-toolkit')
const SoapClient = SOAP('1.1') // or '1.2'
const client = new SoapClient('service.wsdl')
```

#### Fault handling consistency

Both classes expose a static `createError()` method that generates HTTP 500 errors with properly formatted SOAP Fault bodies, enabling consistent server-side error responses:

```javascript
const {SOAP11} = require('xml-toolkit')
// In an Express route handler:
if (validationFailed) {
  throw SOAP11.createError({
    code: 'Client',
    message: 'Invalid request format',
    detail: {errors: ['missing userId']}
  })
}
```

### 9.3 Message construction and encoding

The primary interface for building SOAP messages is the `http()` method, which transforms a plain JavaScript object into a complete HTTP request configuration.

#### Basic message construction

```javascript
const {SOAP11} = require('xml-toolkit')
const soap = new SOAP11('service.wsdl')

const {method, headers, body} = soap.http({
  CreateUser: {
    username: 'alice',
    email: 'alice@example.com'
  }
})

// Result:
// method: 'POST'
// headers: {
//   'Content-Type': 'text/xml; charset=utf-8',
//   'SOAPAction': 'http://example.com/CreateUser' // auto-extracted
// }
// body: '<soap:Envelope>...<CreateUser>...</CreateUser>...</soap:Envelope>'
```

#### How serialization works

1. **Object → XML**: The request payload is serialized using `XMLSchemata.stringify()`, which leverages the WSDL's embedded XML Schema definitions to produce namespace-aware, schema-compliant XML.

2. **Envelope wrapping**: The serialized body element is wrapped in a `<soap:Envelope>` with optional `<soap:Header>` support:
   ```javascript
   // With custom header:
   const header = {Security: {Token: 'abc123'}}
   const {body} = soap.http({CreateUser: {...}}, header)
   ```

3. **Encoding declaration**: UTF-8 is used by default; the XML declaration is included in the envelope [[4]].

#### Decoding responses with SOAPEncoding

For responses using SOAP encoding styles (e.g., `soapenc:Array`, `soap:Map`), the `SOAPEncoding` helper decodes XML nodes back to JavaScript values:

```javascript
const {SOAPEncoding} = require('xml-toolkit')
const decoder = new SOAPEncoding({emptyScalar: null})

// Given a parsed XMLNode from a SOAP response:
const result = decoder.decode(responseNode)
// Handles xsi:nil, xsi:type, soapenc:Array, soap:Map automatically
```

Supported decoding rules [[4]]:
- `xsi:nil="true"` → `null`
- `xsi:type="xs:string"` → string value
- `soapenc:Array` → JavaScript array
- `soap:Map` → JavaScript object with key/value pairs

## 10. Invoking SOAP Services

With the SOAP fundamentals established in the previous section, this chapter walks through the practical workflow for invoking SOAP web services using `node-xml-toolkit`. The library's approach emphasizes minimal abstraction: you construct the HTTP request configuration, then use Node.js's native `http` or `https` modules to transmit it. This design keeps dependencies low while giving you full control over transport-layer behavior like timeouts, retries, and connection pooling .

### 10.1 Creating a SOAP client from WSDL

The entry point for SOAP integration is instantiating either `SOAP11` or `SOAP12` with a path to a WSDL document:

```javascript
const {SOAP11} = require('xml-toolkit')

// Load and parse the WSDL at construction time
const soap = new SOAP11('service.wsdl')
```

#### What happens during construction

1. **WSDL parsing**: The constructor creates an internal `XMLSchemata` instance to parse the WSDL file into a tree of `XMLNode` objects.

2. **Definition indexing**: The client scans for `<wsdl:definitions>` elements (namespace `http://schemas.xmlsoap.org/wsdl/`) and stores them in the `definitions` array for metadata lookups.

3. **Schema caching**: The embedded SOAP envelope schema (`soap-1.1.xsd` or `soap-1.2.xsd`) is loaded once and cached statically for message validation.

#### Reusing clients

Because WSDL parsing occurs only once at construction, you should reuse SOAP client instances across requests:

```javascript
// ✅ Recommended: singleton or module-level instance
const soapClient = new SOAP11('service.wsdl')

module.exports = {
  callService: async (payload) => {
    const {method, headers, body} = soapClient.http(payload)
    // ... send request
  }
}
```

> **Note**: The WSDL file path is resolved relative to the caller's working directory. For production deployments, consider using `path.join(__dirname, 'wsdl/service.wsdl')` for reliable resolution.

### 10.2 Building request payloads from plain objects

The `http()` method is the primary interface for constructing SOAP requests. It accepts a plain JavaScript object and returns a complete HTTP request configuration.

#### Basic payload structure

```javascript
const {method, headers, body} = soap.http({
  GetUser: {              // ← Request element name from WSDL
    userId: '12345',      // ← Child elements become XML children
    includeProfile: true
  }
})
```

#### How the transformation works

1. **Element name resolution**: The library uses the object's top-level key (`GetUser`) to:
   - Locate the corresponding `<wsdl:message>` in the parsed WSDL
   - Extract the `soapAction` HTTP header value via `getSoapActionByElementLocalName()` 

2. **Schema-based serialization**: The payload object is passed to `XMLSchemata.stringify()`, which uses the WSDL's embedded XML Schema definitions to produce namespace-aware, schema-compliant XML.

3. **Envelope wrapping**: The serialized body element is wrapped in a `<soap:Envelope>` with proper namespace declarations:

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetUser xmlns="urn:service:types">
      <userId>12345</userId>
      <includeProfile>true</includeProfile>
    </GetUser>
  </soap:Body>
</soap:Envelope>
```

#### Dynamic SOAPAction resolution

The library automatically populates the `SOAPAction` header by traversing the WSDL metadata:

```javascript
// Internal lookup chain:
// element name → message name → operation name → soapAction attribute
headers.SOAPAction = soap.getSoapActionByElementLocalName('GetUser')
// Returns: "http://example.com/GetUser" (from WSDL)
```

If the WSDL lacks explicit `soapAction` attributes, the client falls back to WS-Addressing `Action` attributes or returns an empty string.

### 10.3 Sending requests with Node.js http/https

Once you have the `{method, headers, body}` configuration, use Node.js's built-in HTTP modules to transmit the request.

#### Basic HTTP request

```javascript
const http = require('http')
const {SOAP11} = require('xml-toolkit')

const soap = new SOAP11('service.wsdl')
const endpoint = 'http://api.example.com/soap'

const {method, headers, body} = soap.http({
  CreateUser: {username: 'alice', email: 'alice@example.com'}
})

const req = http.request(endpoint, {method, headers}, (res) => {
  let data = ''
  res.setEncoding('utf8')
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('Response body:', data)
      // Parse response XML here (see Section 11.4)
    } else {
      console.error('HTTP error:', res.statusCode, data)
    }
  })
})

req.on('error', (err) => console.error('Request failed:', err))
req.write(body)
req.end()
```

#### HTTPS with TLS options

For secure endpoints, use the `https` module with custom TLS configuration:

```javascript
const https = require('https')
const fs = require('fs')

const {method, headers, body} = soap.http({SecureOperation: {...}})

const req = https.request('https://api.example.com/soap', {
  method,
  headers,
  key: fs.readFileSync('client-key.pem'),
  cert: fs.readFileSync('client-cert.pem'),
  ca: [fs.readFileSync('ca-cert.pem')]
}, handleResponse)

req.write(body)
req.end()
```

### 10.4 Parsing and handling responses and faults

After sending a request, you'll need to parse the SOAP response and handle potential faults. The library provides utilities for both tasks.

#### Parsing successful responses

Use `XMLParser` for small responses or `XMLReader` for streaming large responses:

```javascript
const {XMLParser} = require('xml-toolkit')

// Parse the response body string
const parser = new XMLParser()
const responseDoc = parser.process(responseBody)

// Navigate to the response element
const result = responseDoc.children
  .find(n => n.localName === 'GetUserResponse')
  ?.children
  ?.find(n => n.localName === 'userData')

if (result) {
  const userData = XMLNode.toObject({})(result) // Convert to plain JS object
  console.log('User data:', userData)
}
```

#### Decoding SOAP-encoded values

For responses using SOAP encoding styles (`soapenc:Array`, `soap:Map`), use the `SOAPEncoding` helper:

```javascript
const {SOAPEncoding, XMLParser} = require('xml-toolkit')

const decoder = new SOAPEncoding({emptyScalar: null})
const parser = new XMLParser()
const responseDoc = parser.process(responseBody)

// Find the encoded element (e.g., xsi:type="soapenc:Array")
const encodedNode = responseDoc.children
  .find(n => n.attributes.get('type', 'http://www.w3.org/2001/XMLSchema-instance')?.includes('Array'))

if (encodedNode) {
  const decoded = decoder.decode(encodedNode)
  console.log('Decoded array:', decoded) // Now a native JavaScript array
}
```

Supported decoding rules [[2]]:
| XML Attribute | JavaScript Result |
|--------------|------------------|
| `xsi:nil="true"` | `null` |
| `xsi:type="xs:string"` | String value |
| `soapenc:Array` | JavaScript `Array` |
| `soap:Map` | JavaScript `Object` with key/value pairs |

#### Handling SOAP faults

When a service returns a fault, the response body contains a `<soap:Fault>` element. You can detect and parse it manually, or use the library's `SOAPFault` helper:

```javascript
const {SOAP11, XMLParser} = require('xml-toolkit')

if (res.statusCode !== 200) {
  const parser = new XMLParser()
  const faultDoc = parser.process(responseBody)
  
  const faultNode = faultDoc.children
    .find(n => n.localName === 'Fault')
  
  if (faultNode) {
    // Extract fault details
    const faultCode = faultNode.children
      .find(n => n.localName === 'faultcode')?.src
    const faultString = faultNode.children
      .find(n => n.localName === 'faultstring')?.src
    
    console.error(`SOAP Fault [${faultCode}]: ${faultString}`)
    throw new Error(`SOAP Error: ${faultString}`)
  }
}
```

## 11. Implementing a SOAP Service (Server-Side)

While `node-xml-toolkit` is often used as a SOAP client, its architecture is equally suited for implementing server-side SOAP endpoints. The same `SOAP11` and `SOAP12` classes that build outbound requests can also construct compliant response envelopes, and the library's schema-aware serialization ensures your replies match the WSDL contract. This section covers the complete server-side workflow: receiving requests, validating payloads, constructing responses, and handling faults.

> **Design note**: The library intentionally avoids high-level server abstractions (like Express middleware wrappers). Instead, it provides low-level, composable primitives that integrate cleanly with any Node.js HTTP framework—aligning with the project's philosophy of minimal dependencies and maximum control.

### 11.1 Receiving and parsing SOAP requests

When a SOAP request arrives at your endpoint, the first step is to parse the XML envelope and extract the body payload. `node-xml-toolkit` offers two parsing strategies depending on payload size and performance requirements.

#### Parsing with XMLParser (small/medium payloads)

For typical request sizes (<10MB), the synchronous `XMLParser` provides the simplest workflow:

```javascript
const {XMLParser, SOAP11} = require('xml-toolkit')

app.post('/soap', (req, res) => {
  let body = ''
  req.setEncoding('utf8')
  req.on('data', chunk => body += chunk)
  req.on('end', () => {
    try {
      // Parse the full SOAP envelope
      const parser = new XMLParser()
      const envelope = parser.process(body)
      
      // Navigate to the SOAP Body
      const soapNs = 'http://schemas.xmlsoap.org/soap/envelope/'
      const soapBody = envelope.children
        .find(n => n.localName === 'Body' && n.namespaceURI === soapNs)
      
      if (!soapBody) {
        throw new Error('Missing SOAP Body')
      }
      
      // Extract the operation element (first child of Body)
      const operation = soapBody.children[0]
      const operationName = operation.localName
      
      console.log(`Received ${operationName} request`)
      
      // Convert to plain object for business logic
      const payload = operation.toObject({})
      
      // ... process payload ...
      
    } catch (err) {
      console.error('Parse error:', err.message)
      res.status(400).send('Malformed request')
    }
  })
})
```

#### Streaming with XMLReader (large payloads)

For large request bodies or when you need to filter specific elements, use the asynchronous `XMLReader`:

```javascript
const {XMLReader, XMLNode} = require('xml-toolkit')

app.post('/soap/bulk', async (req, res) => {
  try {
    // Stream only the <Record> elements from the request body
    const records = new XMLReader({
      filterElements: 'Record',
      map: XMLNode.toObject({})
    }).process(req)
    
    const results = []
    for await (const record of records) {
      // Process each record incrementally
      const processed = await businessLogic(record)
      results.push(processed)
    }
    
    // Send response (see Section 12.3)
    sendSoapResponse(res, {BulkProcessResponse: {results}})
    
  } catch (err) {
    console.error('Streaming error:', err)
    res.status(500).send('Processing failed')
  }
})
```

#### Extracting SOAP headers

If your service requires WS-Security or custom headers, extract them during parsing:

```javascript
// After parsing the envelope:
const soapHeader = envelope.children
  .find(n => n.localName === 'Header' && n.namespaceURI === soapNs)

if (soapHeader) {
  const security = soapHeader.children
    .find(n => n.localName === 'Security')
  
  if (security) {
    const token = security.children
      .find(n => n.localName === 'Token')?.src
    
    // Validate token...
  }
}
```

> **Tip**: Use `XMLNode.getLocalName()` and `attributes.get()` for namespace-safe attribute access, as shown in the library's WSDL parsing logic.

---

### 11.2 Validating incoming messages against schema

Schema validation ensures incoming requests conform to your WSDL contract. `node-xml-toolkit` supports validation through `XMLSchemata`, which can be initialized with your service's WSDL or standalone XSD files.

#### Loading schema for validation

```javascript
const {XMLParser, XMLSchemata} = require('xml-toolkit')

// Load WSDL at server startup (cache for performance)
const schemata = new XMLSchemata('service.wsdl')

app.post('/soap', (req, res) => {
  // ... receive body ...
  
  const parser = new XMLParser({xs: schemata})
  const envelope = parser.process(body)
  
  // Check for validation messages after parsing
  if (parser.validationMessages.length > 0) {
    const errors = parser.validationMessages
    
    if (errors.length > 0) {
      // Return SOAP Fault (see Section 12.4)
      return sendSoapFault(res, {
        code: 'Client',
        message: 'Schema validation failed',
        detail: {errors}
      })
    }
  }
  
  // Proceed with valid request...
})
```

### 11.3 Constructing and sending SOAP responses

Once your business logic completes, use the `SOAP11` or `SOAP12` class to build a compliant response envelope. The same `http()` method used for client requests works symmetrically for server responses.

#### Basic response construction

```javascript
const {SOAP11} = require('xml-toolkit')

function sendSoapResponse(res, payload, header = null) {
  const soap = new SOAP11('service.wsdl') // WSDL for schema-aware serialization
  
  // Build the SOAP envelope
  const {body} = soap.http(payload, header)
  
  // Send with correct headers
  res.status(200)
    .set('Content-Type', SOAP11.contentType + '; charset=utf-8')
    .send(body)
}

// Usage in route handler:
sendSoapResponse(res, {
  GetUserResponse: {
    userData: {
      userId: '12345',
      email: 'alice@example.com',
      active: true
    }
  }
})
```

#### How serialization works

1. **Schema-aware stringification**: The payload object is passed to `XMLSchemata.stringify()`, which uses the WSDL's embedded XML Schema to produce namespace-correct XML [[2]].

2. **Envelope wrapping**: The serialized body element is wrapped in a `<soap:Envelope>` with proper namespace declarations:
   ```xml
   <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
     <soap:Body>
       <GetUserResponse xmlns="urn:service:types">
         <userData>
           <userId>12345</userId>
           <!-- ... -->
         </userData>
       </GetUserResponse>
     </soap:Body>
   </soap:Envelope>
   ```

3. **Header support**: Optional SOAP headers (e.g., WS-Addressing `ReplyTo`) are passed as the second argument to `http()`:
   ```javascript
   const header = {
     ReplyTo: {
       Address: 'http://client.example.com/callback'
     }
   }
   sendSoapResponse(res, payload, header)
   ```

### 11.4 Error handling and SOAPFault generation

When errors occur, SOAP services must return properly formatted `<soap:Fault>` elements. `node-xml-toolkit` provides the `SOAPFault` class for structured fault data and the static `createError()` method for generating HTTP-compatible error responses.

#### Using SOAPFault for structured errors

```javascript
const {SOAPFault} = require('xml-toolkit')

// Create a fault object with standard fields
const fault = new SOAPFault({
  code: 'Client',           // or 'Server', 'VersionMismatch', 'MustUnderstand'
  message: 'Invalid userId format',
  detail: {                 // Optional application-specific details
    field: 'userId',
    expected: 'numeric string',
    received: 'abc123!'
  }
})
```

#### Generating HTTP error responses with createError()

The static `createError()` method returns an `http-errors` compatible object that sets the correct `Content-Type` header and includes the serialized `<soap:Fault>` XML:

```javascript
const {SOAP11} = require('xml-toolkit')

function sendSoapFault(res, faultOptions) {
  // createError() returns an Error-like object with .status, .headers, .message
  const error = SOAP11.createError(faultOptions)
  
  res.status(error.status)          // Always 500 for SOAP faults
    .set(error.headers)             // Sets Content-Type: text/xml; charset=utf-8
    .send(error.message)            // Serialized <soap:Fault> XML
}

// Usage:
if (!isValidUserId(userId)) {
  return sendSoapFault(res, {
    code: 'Client',
    message: 'userId must be a numeric string',
    detail: {field: 'userId', value: userId}
  })
}
```

#### SOAP 1.1 vs. SOAP 1.2 fault structures

| Field | SOAP 1.1 | SOAP 1.2 |
|-------|----------|----------|
| **Element name** | `<faultcode>`, `<faultstring>` | `<Code>`, `<Reason>` |
| **Code format** | `faultcode` (qualified name) | `Code/Value` (nested) |
| **Actor/Role** | `<faultactor>` | `<Role>` |
| **Detail** | `<detail>` with custom XML | `<Detail>` with custom XML |
| **Language** | N/A | `Reason/Text[@xml:lang]` |

The library handles these differences automatically based on whether you use `SOAP11` or `SOAP12`:

```javascript
// SOAP 1.1 fault output:
// <soap:Fault>
//   <faultcode>Client</faultcode>
//   <faultstring>Invalid userId</faultstring>
//   <detail><errors>...</errors></detail>
// </soap:Fault>

// SOAP 1.2 fault output:
// <soap:Fault>
//   <Code><Value>Receiver</Value></Code>
//   <Reason><Text xml:lang="en">Invalid userId</Text></Reason>
//   <Detail><errors>...</errors></Detail>
// </soap:Fault>
```

#### Complete error handling pattern

```javascript
const {SOAP11, XMLParser} = require('xml-toolkit')

app.post('/soap', async (req, res) => {
  try {
    // 1. Parse request
    const body = await readRequestBody(req)
    const parser = new XMLParser()
    const envelope = parser.process(body)
    
    // 2. Extract operation
    const operation = extractOperation(envelope)
    const payload = operation.toObject({})
    
    // 3. Business logic (may throw)
    const result = await processRequest(payload)
    
    // 4. Send success response
    sendSoapResponse(res, {
      [`${operation.localName}Response`]: result
    })
    
  } catch (err) {
    // 5. Map errors to SOAP faults
    if (err instanceof ValidationError) {
      return sendSoapFault(res, {
        code: 'Client',
        message: err.message,
        detail: err.details
      })
    }
    
    if (err instanceof AuthenticationError) {
      return sendSoapFault(res, {
        code: 'Client',
        message: 'Authentication failed',
        actor: 'http://service.example.com/auth'
      })
    }
    
    // Default: server error
    console.error('Unhandled error:', err)
    return sendSoapFault(res, {
      code: 'Server',
      message: 'Internal processing error',
      detail: process.env.NODE_ENV === 'development' ? {stack: err.stack} : undefined
    })
  }
})
```
