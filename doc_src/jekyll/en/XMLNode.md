---
layout: default
title: "XMLNode API"
---
# Navigating the document tree

* toc
{:toc}

The [`XMLNode`](https://github.com/do-/node-xml-toolkit/wiki/XMLNode) class is the output of both [`XMLParser`](../XMLParser) and [`XMLReader`](../XMLReader). In most cases, its instances are immediately [converted to plain objects](../XMLNode.toObject) for further processing, but, seldomly, you need more [DOM](https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html) like features.

This section covers part of `XMLNode` API necessary for using in applications. Some internal properties and methods are omitted. For clarity, only element nodes are covered (not CDATA etc.)

## Element's Name

The `name` property represents the element's name as in XML 1.0, i. e. maybe with a namespace prefix. For safety, you better use `localName` and `namespaceURI` properties:

```js

const doc = (new XMLParser()).process('<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">');

console.log(doc.name);         // xsl:stylesheet
console.log(doc.localName);    // stylesheet
console.log(doc.namespaceURI); // http://www.w3.org/1999/XSL/Transform
```

## Attributes

Attributes are exposed via an [`AttributesMap`](https://github.com/do-/node-xml-toolkit/wiki/AttributesMap) instance subclassing [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map):

```javascript
const dbHost = dbNode.attributes.get('host'); // "localhost"

// Check existence
if (dbNode.attributes.has('ssl')) {
  console.log('SSL enabled:', dbNode.attributes.get('ssl'));
}
```

Local overloaded `get()` honors namespaces:
```javascript
const theId = policy.attributes.get(
  'Id', 
  "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"
);
```

> **Note**: Attribute values are always strings. When necessary, convert them explicitly:

```javascript
const port = parseInt(dbNode.attributes.get('port'), 10);
const ssl = dbNode.attributes.get('ssl') === 'true';
```

## Child elements

The `.children` array is always safe to scan through: for leaf nodes, it's empty, but never [nullish](https://developer.mozilla.org/en-US/docs/Glossary/Nullish).

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

## Text content

This calculated property is much like its [HTML DOM counterpart](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText): it concatenates all child text and CDATA nodes. With `stripSpace: true`, which is by default, the text is always `.trim()`med.

```javascript
const config = `
  <title>
    Application <![CDATA[Server]]>
  </title>
`;
const doc = new XMLParser().process(config);
console.log(doc.innerText); // "Application Server"
```

## toString()

While, in `node-xml-toolkit` the only way to obtain an `XMLNode` is to parse some XML source, sometimes you need to print out a selected element source. In this case, just use the `.toString()` overloaded method (e. g. implicitly):

```js
console.log ('Here: ' + doc.children [0])
```

The result is not guaranteed to be the exact fragment of the source, as CDATA sections are converted into text nodes and sibling texts are merged. Still the second parsing will produce the equivalent result.

By supplying [`XMLPrinter`' options](../XMLPrinter#configuration)', you can pretty print it on purpose:

```js
console.log ('Look at it: ' + doc.children [0].toString ({
  space: 2,              // 2-space indentation
  attrSpace: '  ',       // Attributes on new lines, indented 2 extra spaces
}))
```