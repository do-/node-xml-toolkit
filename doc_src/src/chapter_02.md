# 2. Core Concepts

Before diving into code examples, it is essential to understand the architectural decisions and mental models that underpin `node-xml-toolkit`. This chapter establishes the foundational concepts that will make the rest of the book—and your usage of the library—more intuitive and effective.

## 2.1 Synchronous vs. asynchronous parsing

`node-xml-toolkit` offers two distinct parsing approaches, each suited to different scenarios:

### Synchronous parsing with `XMLParser`

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

### Asynchronous parsing with `XMLReader`

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

### Choosing the right approach

| Scenario | Recommended parser |
|----------|-------------------|
| Loading application config (`config.xml`) | `XMLParser` |
| Parsing a 2 GB export from a legacy system | `XMLReader` |
| Extracting a single value from a known path | `XMLParser` (if file is small) or `XMLReader` with early exit |
| Transforming records and writing to another stream | `XMLReader` + `XMLStreamPrinter` |
| Unit testing XML generation logic | `XMLParser` for simplicity |

## 2.2 Streaming architecture and memory efficiency

At its core, `node-xml-toolkit` is built around streaming principles. Even the synchronous `XMLParser` uses a streaming lexer internally; it simply consumes the entire stream before returning.

### The streaming pipeline

```
Raw bytes → XMLLexer → SAXEvent stream → XMLReader/XMLParser → XMLNode tree (optional)
```

- **`XMLLexer`**: The lowest-level component. It tokenizes raw character data into SAX-style events (`startElement`, `endElement`, `characters`, etc.). It is memory-efficient but requires you to manage state.
- **`XMLReader`**: Builds on `XMLLexer` to provide a higher-level, node-oriented async iterator. It yields `XMLNode` objects incrementally, allowing you to process documents without building the full tree.
- **`XMLParser`**: Consumes the entire event stream from `XMLLexer` and constructs a complete in-memory document tree.

### Memory usage patterns

- **Tree-based parsing** (`XMLParser`): Memory usage scales with document size and complexity. A 100 MB XML file may consume 300–500 MB of RAM due to object overhead.
- **Streaming parsing** (`XMLReader`): Memory usage remains roughly constant, determined by the depth of the current parsing path and any buffers you maintain. A 10 GB file can be processed with <50 MB of RAM if you process and discard nodes promptly.

The `XMLReader` will pause reading when downstream consumers cannot keep up, preventing memory buildup.

## 2.3 XML nodes, events, and the document model

### The `XMLNode` abstraction

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

### Navigating the tree

```javascript
// Find first child element with localName 'price'
const priceNode = doc.children.find(c => c.localName === 'price');

// Access attribute safely
const currency = priceNode?.attributes?.currency ?? 'USD';

// Get text content
const amount = priceNode?.textContent?.trim();
```

In streaming mode (`XMLReader`), the `parent` reference may be `null` for performance reasons, and `children` may be empty if you have not configured the reader to collect them. Always check the reader's configuration when relying on tree structure.

### Events vs. nodes

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

## 2.4 Namespaces and attributes handling

### Namespaces: explicit and scoped

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

### The `NamespacesMap` and `AttributesMap` helpers

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

### Default namespaces and inheritance

Child elements inherit the default namespace of their parent unless overridden:

```javascript
// In the example above, <product> inherits xmlns="http://example.com/products"
// So its namespaceURI is set automatically, even though the source XML
// does not repeat the xmlns attribute on <product>.
```

Be mindful of this when filtering or matching elements by namespace in large documents.

## 2.5 Schema-aware vs. schema-less workflows

`node-xml-toolkit` supports both validation-driven and flexible, schema-less processing.

### Schema-less: rapid prototyping and permissive parsing

By default, the toolkit parses any well-formed XML without requiring a schema. This is ideal for:

- Exploratory data analysis
- Integrating with loosely specified external feeds
- Prototyping before formalizing data contracts

```javascript
const doc = parser.process(xml); // No schema needed
const value = doc.children[0].textContent;
```

### Schema-aware: validation and structured serialization

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
