![workflow](https://github.com/do-/node-xml-toolkit/actions/workflows/main.yml/badge.svg)
![Jest coverage](./badges/coverage-jest%20coverage.svg)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/do-/node-xml-toolkit)

`node-xml-toolkit` is a pure node.js library for solving diverse XML related application tasks, e. g.:
* scanning through multi gigabyte long XML files with a limited memory buffer;
* invoke SOAP Web services given a WSDL, method name and a plain data object.

It features both (fast and simple, but greedy) [synchronous](https://github.com/do-/node-xml-toolkit/wiki/XMLParser) and (trickier to use, but robust and streaming capable) [asynchronous](https://github.com/do-/node-xml-toolkit/wiki/XMLReader) XML parsers along with various tools for writing well formed XML: [according to a schema](https://github.com/do-/node-xml-toolkit/wiki/XMLMarshaller) or [without any](https://github.com/do-/node-xml-toolkit/wiki/XMLPrinter).

# Installation

```
npm install xml-toolkit
```

# Usage
* [Parsing a small file completely](XMLParser) (optionally validating)

```js
const fs = require ('fs')
const {XMLParser, XMLSchemata} = require ('xml-toolkit')

const xml    = fs.readFileSync ('doc.xml')
// const xs  = new XMLSchemata ('schema.xsd')

const parser = new XMLParser  ({
// xs,
})

const document = parser.process (xml)

// console.log (parser.validationMessages)

for (const element of document.detach ().children) {
  console.log (element.attributes)
}
```

* [Reading a Record List](https://github.com/do-/node-xml-toolkit/wiki/Use-Case:-Reading-a-Record-List) (optionally validating)

```js
const {XMLReader, XMLNode, XMLSchemata} = require ('xml-toolkit')

// const xs  = new XMLSchemata ('schema.xsd')

const records = new XMLReader ({
//xs,
  filterElements : 'Record', 
  map            : XMLNode.toObject ({})
})
//.on ('validation-message', s => console.log (s))
  .process (xmlSource)

// ...then:
// await someLoader.load (records)

// ...or
// for await (const record of records) { // pull parser mode

// ...or
// records.on ('error', e => console.log (e))
// records.pipe (nextStream)

// ...or
// records.on ('error', e => console.log (e))
// records.on ('data', record => doSomethingWith (record))
```

* [Getting a Single Element](https://github.com/do-/node-xml-toolkit/wiki/Use-Case:-Getting-a-Single-Element)

```js
const {XMLReader, XMLNode} = require ('xml-toolkit')

const data = await new XMLReader ({
  filterElements : 'MyElementName', 
  map            : XMLNode.toObject ({})
}).process (xmlSource).findFirst ()
```

* [Formatting XML](https://github.com/do-/node-xml-toolkit/wiki/XMLPrinter)
```js
const {XMLParser} = require ('xml-toolkit')
xml = new XMLParser ()
  .process (fs.readFileSync ('doc.xml'))
  .toString ({
//  decl: {encoding: 'UTF-8', standalone: 1},
    space: '\t', 
//  attrSpace: 2, 
//  EOL: '\n',
//  level: 0, 
//  encodeLineBreaks: false,
   })
```

* [Patching XML](https://github.com/do-/node-xml-toolkit/wiki/Use-Case:-Patching-XML)

```js
const {XMLReader} = require ('xml-toolkit')

let xmlResult = ''; for await (const node of new XMLReader ().process (xmlSource)) xmlResult += 
    node.isCharacters && node.parent.localName === 'ThePlaceHolder' ? id : 
    node.xml
```

* [Serializing an Object According to an XML Schema](https://github.com/do-/node-xml-toolkit/wiki/Use-Case:-Serializing-an-Object-According-to-an-XML-Schema)

```js
const data = {ExportDebtRequestsResponse: {	
  "request-data": {
   // ...
  }
}

const xs = new XMLSchemata ('xs.xsd')

const xml = xs.stringify (data)

/* result:
<ns0:ExportDebtRequestsResponse xmlns:ns0="urn:...">
  <ns0:request-data>
    <!-- ... and so on ... -->
*/
```
* Invoking a [SOAP 1.1](SOAP11) Web Service

```js
const http = require ('http')
const {SOAP11} = require ('xml-toolkit')

const soap = new SOAP11 ('their.wsdl')

const {method, headers, body} = soap.http ({RequestElementNameOfTheirs: {amount: '0.01'}})

const rq = http.request (endpointURL, {method, headers})
rq.write (body)
```

# Motivation

Unlike Java (with [JAXB](https://www.oracle.com/technical-resources/articles/javase/jaxb.html) and [JAX-WS](https://www.oracle.com/technical-resources/articles/javase/jax-ws-2.html)) and some other software development platforms dating back to late 1990s, the core node.js library doesn't offer any standard tool for dealing with XML.

It might be a binding of a well known external library ([libxml](https://gitlab.gnome.org/GNOME/libxml2) comes to mind first — as it's [built in PostgreSQL](https://www.postgresql.org/docs/current/functions-xml.html) in many popular distros, for example), but, alas, nothing viable of this sort seem to be available.

Pure js 3rd party modules are abundant, but after some real tasks based researches the author decided to start up yet another node.js DIY XML toolkit project to get the job done with:
* minimum computing resources;
* minimum lines of application code;
* minimum external dependencies.

# Limitations

No W3C specification is 100% implemented here. For instance, DTDs are not supported, so, in theory, any rogue XML file using such bizarre deprecated feature as [Entity Declarations](https://www.w3.org/TR/xml/#sec-entity-decl) may crash the local XML parser.

The [XMLSchema](https://github.com/do-/node-xml-toolkit/wiki/XMLSchemata) is fairly usable for most real world cases, still some features (like `xs:unique`) are ignored completely, some others may require more test coverage. In general, XML Schema support in `xml-toolkit` should be considered _forever beta_.

There are perfectly reliable external tools for XML validation: for instance, [xmllint](https://linux.die.net/man/1/xmllint) (used in the test suite here) do just fine.