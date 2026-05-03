---
layout: default
title: Writing XML
---
# Writing XML
* toc
{:toc}

In this section, you see some code to borrow for typical tasks requiring XML generation.

Details are described in the following chapters.

## Marshalling Objects according to a Schema
### Moderate size document

Suppose you have to serialize a portion of data as a valid XML document. You already constructed an object hierarchy where properties are named like necessary target attributes and children. Now it takes to apply an XML Schema as a template:

```js
const {XMLSchemata} = require ('xml-toolkit')

const xs  = new XMLSchemata ('indebtedness.xsd')
const obj = {
  DebtRequest: {
    "request-data": {
      // more content here
    }
  }
}

const xml = xs.stringify (obj)

/* result:
<ns0:DebtRequest xmlns:ns0="urn:..."><ns0:request-data><!-- ... -->
*/
```

In case you want to control formatting options, instantiate an [XMLMarshaller](../XMLMarshaller), set the underlying [XMLPrinter options](../XMLPrinter#configuration) and use it the explicit away:

```js
const {XMLSchemata} = require ('xml-toolkit')

const xs         = new XMLSchemata ('indebtedness.xsd')
const marshaller = xs.createMarshaller (
    'DebtRequest',  // localName
    'urn:...',      // namespaceURI
    {
      space: '  ',  // XMLPrinter option(s)
    }
)

const obj = {       // no 'DebtRequest' on top
  "request-data": {
    // more content here
  }
}

const xml = marshaller.stringify (obj)

/* result:
<ns0:DebtRequest xmlns:ns0="urn:...">
  <ns0:request-data>
    <!-- ... and so on ... -->
*/
```

### Long file

You can use an XML Schema as a kind of blueprint for producing very large documents with linear node sets: typically, relational table dumps. In this case, to prevent memory exhausting, it takes to do two things:
* direct the output into a [Writable stream](https://nodejs.org/docs/latest/api/stream.html#writable-streams),
* provide the data source as a [Readable stream](https://nodejs.org/docs/latest/api/stream.html#readable-streams),
  * you can even place several streams in a single data object.

```js
const fs = require('fs');
const {XMLSchemata} = require ('xml-toolkit')
const xs = new XMLSchemata ('db-export.xsd')

new Promise ((ok, fail) => {

  const out = fs.createWriteStream ('/tmp/dump.xml')
    .on ('error', fail)
    .on ('finish', ok)

  const m = xs.createMarshaller (
    'root-element',           // localName
    'http://tempuri.org',     // namespaceURI
    {
      out,                    // where to write
      space: '  ',            // XMLPrinter option(s)
    }
  )

  m.stringify ({ ts: new Date (),
    record: Readable.from ([
      {id: 1}
      // , ...moreRecords
    ])
  })

}).then (() => console.log ('OK'), err => console.error (err))

/* result:
<ns0:root-element xmlns:ns0="http://tempuri.org">
  <ns0:record><id>1</id></ns0:record>
    <!-- ... moreRecords ... -->
</ns0:root-element>
*/

```

## Just Printing Well Formed XML

While using [XMLMarshaller](../XMLMarshaller) seems preferable, some tasks just lack any agreed XML Schema. Or it can happen to be so trivial that the developer may opt to do without it and write the output directly. Still, is always necessary to escape special characters, so you better use the low level [XMLPrinter options](../XMLPrinter).

### Stringifying Small Documents In-Memory

```javascript
const {XMLPrinter} = require('xml-toolkit');

const xp = new XMLPrinter({ space: 2 });

const xml = xp
  .openElement('product')
    .writeAttribute('model', `'"`)
    .openElement('brand')
      .writeCharacters('<<B&W>>')
    .closeElement()
  .closeElement()
  .text;

console.log(xml);

xp.reset(); // Cleaned up, may be used again
xp.writeXMLDecl({ encoding: 'UTF-8', standalone: 1 }); 
  // ...etc next document
```

### Generating a Feed Document as a Stream

As nearly everything in `node-xml-toolkit`, pretty printing XML have two versions: blocking atomic and asynchronous streaming:

```javascript
const fs = require('node:fs');
const {XMLStreamPrinter} = require('xml-toolkit');

function generateFeed(items, outputPath) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(outputPath);
    out.on('finish', resolve);
    out.on('error', reject);

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