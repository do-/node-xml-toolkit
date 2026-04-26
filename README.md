![workflow](https://github.com/do-/node-xml-toolkit/actions/workflows/main.yml/badge.svg)
![Jest coverage](./badges/coverage-jest%20coverage.svg)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/do-/node-xml-toolkit)
[![npm version](https://img.shields.io/npm/v/xml-toolkit.svg)](https://www.npmjs.com/package/xml-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A pure Node.js library for solving diverse XML-related application tasks with minimal resources and dependencies.

`node-xml-toolkit` handles XML parsing, marshalling, and SOAP integration — from streaming multi-gigabyte files to invoking SOAP 1.1 web services via WSDL.

---

## ✨ Features

- ♊ **Dual parsing modes**: Fast <ins>synchronous</ins> parser for small documents; <ins>streaming asynchronous</ins> parser for large files
- 🧠 **Memory-efficient**: Scan multi-GB XML files with limited buffer
- 🧬 **Schema support**: Validate and serialize objects using XML Schema (XSD)
- 🧼 **[SOAP](https://www.w3.org/TR/soap/) 1.1, 1.2 adapters**: Invoke web services directly from WSDL + plain JS objects
- 🖨️ **Flexible output**: Format, patch, or transform XML with configurable options
- 🎏 **Stream-ready**: Works with Node.js streams, async iterators, and event emitters

---

## 📦 Installation

```bash
npm install xml-toolkit
```

---

## 🚀 Quick Start

### Parse a Small XML File (Sync)

```js
const fs = require('fs');
const { XMLParser, XMLSchemata } = require('xml-toolkit');

const xml = fs.readFileSync('doc.xml');
const parser = new XMLParser(); // optionally: { xs: new XMLSchemata('schema.xsd') }
const document = parser.process(xml);

for (const element of document.detach().children) {
  console.log(element.attributes);
}
```

### Stream Large XML Files (Async)

```js
const { XMLReader, XMLNode } = require('xml-toolkit');

const records = new XMLReader({
  filterElements: 'Record',
  map: XMLNode.toObject({})
}).process(xmlSource);

// Use as async iterator
for await (const record of records) {
  // process each record
}

// Or pipe to another stream
// records.pipe(nextStream);
```

### Extract a Single Element

```js
const { XMLReader, XMLNode } = require('xml-toolkit');

const data = await new XMLReader({
  filterElements: 'MyElementName',
  map: XMLNode.toObject({})
}).process(xmlSource).findFirst();
```

### Format / Pretty-Print XML

```js
const { XMLParser } = require('xml-toolkit');

const formatted = new XMLParser()
  .process(fs.readFileSync('doc.xml'))
  .toString({
    space: '\t',        // indentation
    // EOL: '\n',        // line ending
    // encodeLineBreaks: false
  });
```

### Serialize Objects to XML (via XSD)

```js
const { XMLSchemata } = require('xml-toolkit');

const data = { ExportDebtRequestsResponse: { 'request-data': { /* ... */ } } };
const xs = new XMLSchemata('schema.xsd');
const xml = xs.stringify(data);
// → <ns0:ExportDebtRequestsResponse xmlns:ns0="urn:...">...
```

### Invoke a SOAP 1.1 Web Service

```js
const http = require('http');
const { SOAP11 } = require('xml-toolkit');

const soap = new SOAP11('service.wsdl');
const { method, headers, body } = soap.http({
  RequestElementNameOfTheirs: { amount: '0.01' }
});

const req = http.request(endpointURL, { method, headers });
req.write(body);
req.end();
```

---

## 🧭 Core API Overview

| Class / Export     | Purpose                                      | Mode       |
|--------------------|----------------------------------------------|------------|
| [`XMLParser`](https://do-.github.io/node-xml-toolkit/chapter_03.html)        | Synchronous full-document parsing            | Sync       |
| [`XMLReader`](https://do-.github.io/node-xml-toolkit/chapter_04.html)        | Streaming parser with filtering & mapping    | Async/Stream |
| [`XMLNode`](https://github.com/do-/node-xml-toolkit/wiki/XMLNode)          | DOM-like node representation + utilities     | Both       |
| `XMLSchemata`      | XSD-based [validation](https://do-.github.io/node-xml-toolkit/chapter_03.html#34-optional-validation-with-xmlschemata) & object→XML [serialization](https://do-.github.io/node-xml-toolkit/chapter_08.html) | Both    |
| [`SOAP`](https://do-.github.io/node-xml-toolkit/chapter_09.html#version-selection)             | SOAP adapter using WSDL                      | Sync setup |

---

## ⚠️ Limitations

- ❌ **No DTD support**: Entity declarations may cause parser errors
- 🧪 **XML Schema is "forever beta"**: Features like `xs:unique` are not implemented; validation coverage is partial
- 🔍 For production-grade validation, consider external tools like `xmllint` (used in the library's test suite)

---

## 💡 Motivation

Node.js lacks built-in XML tooling comparable to Java's [JAXB](https://javaee.github.io/jaxb-v2/)/[JAX-WS](https://javaee.github.io/metro-jax-ws/). While many pure-JS XML modules exist, `node-xml-toolkit` was created to deliver most necessary functions with:

- ✅ Minimal computing resources  
- ✅ Minimal application code  
- ✅ [Almost no](https://www.npmjs.com/package/xml-toolkit?activeTab=dependencies) external dependencies  

All in a pure JavaScript implementation.

---

## 📄 License

MIT © [do-](https://github.com/do-)

---

## 🔗 Links

- [GitHub Repository](https://github.com/do-/node-xml-toolkit)  
- [npm Package](https://www.npmjs.com/package/xml-toolkit)  
- [Documentation](https://do-.github.io/node-xml-toolkit)