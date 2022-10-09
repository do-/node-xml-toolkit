# node-xml-toolkit
Collection of classes for dealing with XML

# Installation

```
npm i xml-toolkit
```

# Using
* [Reading a Record List](https://github.com/do-/node-xml-toolkit/wiki/Use-Case:-Reading-a-Record-List)

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

* [Getting a Single Element](https://github.com/do-/node-xml-toolkit/wiki/Use-Case:-Getting-a-Single-Element)

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

const xs = await XMLSchemata.fromFile ('xs.xsd')

const xml = xs.stringify (data)

/* result:
<ns0:ExportDebtRequestsResponse xmlns:ns0="urn:...">
  <ns0:request-data>
    <!-- ... and so on ... -->
*/
```

* Invoking a [SOAP 1.1](https://github.com/do-/node-xml-toolkit/wiki/SOAP11) Web Service

```js
const http = require ('http')
const {SOAP11} = require ('xml-toolkit')

const soap = await SOAP11.fromFile ('their.wsdl')

const {method, headers, body} = soap.http ({RequestElementNameOfTheirs: {amount: '0.01'}})

const rq = http.request (endpointURL, {method, headers})
rq.write (body)
```

More information available in [wiki docs](https://github.com/do-/node-xml-toolkit/wiki).
