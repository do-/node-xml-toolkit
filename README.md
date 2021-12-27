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

More information available in [wiki docs](https://github.com/do-/node-xml-toolkit/wiki).
