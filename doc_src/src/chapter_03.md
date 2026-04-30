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

`XMLParser` accepts the XML source as a string. It reads the entire input and constructs the document tree.

```javascript
const fs = require('fs');
const { XMLParser } = require('xml-toolkit');

const xml = fs.readFileSync('config.xml', 'utf8');

// const xml = `
//   <settings>
//     <database host="localhost" port="5432"/>
//     <logging level="info"/>
//   </settings>
// `;

const doc = (new XMLParser()).process(xml);
console.log(doc.localName); // settings

const obj = XMLNode.toObject({ wrap: true })(doc)
console.log(obj); // {settings: {database: {host: 'localhost', port: '5432'}, logging: {level: 'info'}}}
```

### Configuration options

`XMLParser` accepts an optional configuration object during instantiation:

```javascript
const parser = new XMLParser({
  stripSpace:    true,     // .trim() all text nodes' content
  useEntities:   true      // support entities, including '&amp;', '&quot;' etc.
  useNamespaces: true,     // enable namespace resolution
  xs:        undefined     // XML Schema to validate against, see below
});
```
> **Note**: `useNamespaces` and `useEntities` are for expert use only. They may speed up the process in some cases, but restrict acceptable sources considerably.

## 3.3 Navigating the parsed document tree

The result of `parser.process()` is the document's root element in form of an `XMLNode` instance, basically featuring 
* the `innerText` property (inspired by the [HTML DOM counterpart](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText)),
* a map of `attributes` and
* an array of `children` `XMLNode`s:
  * for a leaf node, it's an empty list (never `null` nor `undefined`).

As of this writing, `node-xml-toolkit` does not implement any [XPath](https://www.w3.org/TR/xpath/) evaluator, but in most practical cases it takes to use `XMLNode.toObject` (see Chapter 5) and then directly access necessary properties.

Although, as the conversion takes a bit of extra memory + time (synchronously) and leads to some information loss (namespaces; single children vs. attributes distinction), you may opt to traverse the tree using standard array methods and node properties, as shown in next few sections.

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

### Working with attributes

Attributes are exposed via an [`AttributesMap`](https://github.com/do-/node-xml-toolkit/wiki/AttributesMap) instance subclassing [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map):

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

`node.innerText` concatenates all child text and CDATA nodes. With `stripSpace: true`, which is by default, the text is always `.trim()`med.

```javascript
const config = `
  <title>
    Application <![CDATA[Server]]>
  </title>
`;
const doc = new XMLParser().process(config);
console.log(doc.innerText); // "Application Server"
```

## 3.4 Error handling

An attempt to parse a ill-formed XML naturally leads `XMLParser` to throwing an `Error`. Its message contains the `[${line}:${position}]` prefix followed by one of:

- `XML-00002`: `Unbalanced end element` — mismatched closing tag
- `XML-00003`: `Unmatched end element, </${ %s }> expected` — unexpected closing tag name

(`XML-00001` is reserved for `maxLength=%i exceeded` but is never thrown by `XMLParser` as it always processes the entire source).

```javascript
try {
  const doc = parser.process(xml)
} catch (err) {
  console.error('Parser failure:', err.message)
}
```

## 3.5 Optional validation with XMLSchemata

Let’s be real: supporting IT integrations is a never-ending tug-of-war. Data providers and consumers are always pointing fingers over whose end caused the glitch. XML Schema can save a lot of troubleshooting time here. 

In theory, any schema violation must immediately block broken input from being processed. Still it happens that management push us to swallow invalid, but somehow recoverable data. And nevertheless, keeping a precise log of who and how actually broke the agreed spec is our best bet for sorting things out down the line.

Provided an XML Schema, `XMLParser` validates the input during the `.process()` execution. Inconsistencies are logged a strings into the `.validationMessages` array.

### Loading schemas

```javascript
const { XMLSchemata, XMLParser } = require('xml-toolkit');
const schemata = new XMLSchemata('schemas/catalog.xsd');
```

> **Note**: The `XMLSchemata` is loaded synchronously, so no HTTP nor other similar network sources are supported; `<xs:import>` and `<xs:include>` elements only work with explicit references to local files.

### Attaching validation to the parser

Pass the schemata instance during parser construction:

```javascript
const parser = new XMLParser({ xs: schemata });

try {
  const doc = parser.process(fs.readFileSync('product-feed.xml'));
  if (parser.validationMessages.length > 0) {
    for (const msg of parser.validationMessages) {
      console.warn(msg) // e.g., "[123:45] XVS-00004 The value 'abc' has the length 3, which exceeds the allowed maximum of 2"
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

Here is the list of errors that can occur in `.validationMessages`:

**Schema definition (`XSD-*`)**
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

> **Note**: The `XMLSchemata` trusts the source provided and doesn't check the schema itself. So `XSD-00001` occurs during the schema application, not loading.
