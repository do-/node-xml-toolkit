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

# Using

* [Parsing a small file completely](XMLParser)

```js
const fs = require ('fs')
const {XMLParser} = require ('xml-toolkit')

const xml    = fs.readFileSync ('doc.xml')
const parser = new XMLParser  ({...options})

const document = parser.process (xml)

for (const element of document.detach ().children) {
  console.log (element.attributes)
}
```

* [Reading a Record List](https://github.com/do-/node-xml-toolkit/wiki/Use-Case:-Reading-a-Record-List), streaming mode

```js
const {XMLReader, XMLNode} = require ('xml-toolkit')

const records = new XMLReader ({
  filterElements : 'Record', 
  map            : XMLNode.toObject ({})
}).process (xmlSource)

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

* [Getting a Single Element](https://github.com/do-/node-xml-toolkit/wiki/Use-Case:-Getting-a-Single-Element), streaming mode

```js
const {XMLReader, XMLNode} = require ('xml-toolkit')

const data = await new XMLReader ({
  filterElements : 'MyElementName', 
  map            : XMLNode.toObject ({})
}).process (xmlSource).findFirst ()
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
const {XMLSchemata} = require ('xml-toolkit')

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

* Invoking a [SOAP 1.1](https://github.com/do-/node-xml-toolkit/wiki/SOAP11) or [SOAP 1.2](https://github.com/do-/node-xml-toolkit/wiki/SOAP12) Web Service

```js
const http = require ('http')
const {SOAP11, SOAP12} = require ('xml-toolkit')

const soap = new SOAP11 ('their.wsdl') // or SOAP12

const {method, headers, body} = soap.http ({RequestElementNameOfTheirs: {amount: '0.01'}})

const rq = http.request (endpointURL, {method, headers})
rq.write (body)
```

* [Implementing](https://github.com/do-/node-xml-toolkit/wiki/Use-Case:-Implement-a-SOAP-Web-Service) a SOAP service

```js
const {XMLSchemata, SOAP11, SOAP12, SOAPFault} = require ('xml-toolkit')

const SOAP = SOAP11 // or SOAP12

const xs = new XMLSchemata (`myService.wsdl`)

let body, statusCode; try {  
  body = xs.stringify (myMethod (/*...*/))
  statusCode = 200
}
catch (x) {
  body = new SOAPFault (x)
  statusCode = 500
}

rp.writeHead (statusCode, {
  'Content-Type': SOAP.contentType,
})

const xml = SOAP.message (body)
rp.end (xml)
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

Though `node-xml-toolkit` has some support for [XMLSchema](https://github.com/do-/node-xml-toolkit/wiki/XMLSchema), it cannot be used for validation. Here, XML Schema is used only as a template for outputting valid XML provided a correct set of input data. That means, each `decimal` will be formatted with proper `fractionDigits`, but no CPU cycle will be spent on checking whether the incoming 10 char string fully conforms to the [`date`](https://www.w3.org/TR/2012/REC-xmlschema11-2-20120405/datatypes.html#date) lexical representation or not.

In short, `node-xml-toolkit` may produce incorrect results for some input data, especially for deliberately broken ones.

There are perfectly reliable external tools for XML validation: for instance, 
[xmllint](https://linux.die.net/man/1/xmllint) (used in the test suite here) do just fine.
