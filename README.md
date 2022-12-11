# node-xml-toolkit
XML parsers (synchronous, streaming), marshaller, SOAP adapters (1.1, 1.2)

# Installation

```
npm i xml-toolkit
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

[Implementing](https://github.com/do-/node-xml-toolkit/wiki/Use-Case:-Implement-a-SOAP-Web-Service) a SOAP service

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

For more information, see [wiki docs](https://github.com/do-/node-xml-toolkit/wiki).
