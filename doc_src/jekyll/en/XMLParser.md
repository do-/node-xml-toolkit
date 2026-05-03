---
layout: default
title: "Atomic XMLParser"
---
# The Synchronous Blocking Parser: `XMLParser`

* toc
{:toc}

If your XML source is small enough:
* not only to fit in available free RAM entirely,
* but to be read completely without freezing node.js for too long,

you can process it with a simple look ahead algo implemented by the [`XMLParser`](https://github.com/do-/node-xml-toolkit/wiki/XMLParser).

## Basic Usage

Create an `XMLParser` instance and feed the XML source as a string to its `.process()` method:

```js
const fs = require('fs');
const { XMLParser } = require('xml-toolkit');

const xml = fs.readFileSync('config.xml', 'utf8');

// const xml = `
//   <settings>
//     <database host="localhost" port="5432"/>
//     <logging level="info"/>
//   </settings>
// `;

const parser = new XMLParser();
const doc    = parser.process(xml);
```
The result `doc` will be an `XMLNode` instance.

In most cases, the obvious next step is to [convert it to a plain object](../XMLNode.toObject):
```js
const obj = XMLNode.toObject()(doc) // SIC! (double)(parentheses)
console.log(obj.database);          // {host: 'localhost', port: '5432'}
```

Or you can [explore its internals directly](../XMLNode):
```js
console.log(doc.localName);         // settings
console.log(doc
  .children
  .find (i => i.localName === 'logging')
  .attributes
  .get ('level'));                  // info
```

## Validation using XML Schema

Provided an [XML Schema](../XMLSchemata), `XMLParser` acts as a validating processor. It collects messages about all inconsistencies found in the `.validationMessages` array.

```js
const fs = require('fs');
const { XMLSchemata, XMLParser } = require('xml-toolkit');

const xs     = new XMLSchemata('schemas/catalog.xsd');
const parser = new XMLParser({xs});
const doc    = parser.process(fs.readFileSync('product-feed.xml'));

for (const msg of parser.validationMessages) {
    console.warn(msg) // e.g., "[123:45] XVS-00004 The value 'abc' has the length 3, which exceeds the allowed maximum of 2"
}
```