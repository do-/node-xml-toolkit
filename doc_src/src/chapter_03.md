# 3. The Synchronous Parser: XMLParser

The `XMLParser` is the entry point for developers who need straightforward, blocking XML parsing. It consumes an entire XML document and returns a complete in-memory tree of `XMLNode` objects. This chapter covers when to choose it, how to load and parse documents, how to navigate the resulting structure, how to attach schema validation, and how to handle errors effectively.

## 3.1 When to use XMLParser

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

## 3.2 Loading and parsing small to medium files

The synchronous parser accepts strings, Buffers, or file paths. It reads the entire input before constructing the document tree.

## Basic usage with a string

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

## Parsing from a file

For file-based workflows, combine `XMLParser` with Node.js synchronous file reading:

```javascript
const fs = require('fs');
const { XMLParser } = require('xml-toolkit');

const xmlBuffer = fs.readFileSync('config.xml');
const parser = new XMLParser();
const doc = parser.process(xmlBuffer);
// const obj = XMLNode.toObject({ wrap: true })(doc)
```

## Parser configuration options

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

## 3.3 Navigating the parsed document tree

The result of `parser.process()` is a root `XMLNode` representing the document element. From there, you traverse the tree using standard array methods and node properties.

## Finding elements

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

## Working with attributes

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

## Extracting text content

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

## Converting to plain objects

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

## 3.4 Optional validation with XMLSchemata

Validation is not required for parsing, but it dramatically improves data reliability when working with external or user-supplied XML.

## Loading schemas

```javascript
const { XMLSchemata, XMLParser } = require('xml-toolkit');
const schemata = new XMLSchemata('schemas/catalog.xsd');
```

`XMLSchemata` source is loaded during the constructor execution. So HTTP and other asynchronous network sources are not supported; `<xs:import>` and `<xs:include>` elements only work when referencing local files.

## Attaching validation to the parser

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

## 3.5 Error handling and diagnostics

`XMLParser` adopts a resilient approach to error handling: parsing and validation issues do not halt execution by default. Instead, diagnostics are collected in the `validationMessages` array, allowing your application to decide whether to treat issues as warnings, recoverable errors, or fatal failures. This design enables graceful degradation when processing partially invalid documents or when schema validation is optional.

> **Version note**: Prior to v1.1.6, validation errors caused `process()` to throw immediately ("fail fast"). Starting with v1.1.6, all diagnostics are collected in `parser.validationMessages` and parsing continues unless a well-formedness error occurs.

## 3.5.1 The `validationMessages` property

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

### Message format

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

### Common error codes

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

## 3.5.2 Distinguishing fatal vs. recoverable errors

Not all messages are equal. Some indicate malformed XML that cannot be reliably processed; others are schema warnings that may be acceptable in your context.

### Fatal: well-formedness errors

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

### Recoverable: schema validation issues

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

## 3.5.4 When parsing fails entirely

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
