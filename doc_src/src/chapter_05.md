# 5. Mapping XML Nodes to Plain Objects

Funny thing: while XML still stands behind the *“X”* in [AJAX](https://en.wikipedia.org/wiki/Ajax_(programming)) and [XHR](https://en.wikipedia.org/wiki/XMLHttpRequest), it was almost completely replaced by [JSON](https://www.json.org/json-en.html) so long ago that one could say it was never really used there. So, a fortiori, a native JS library for XML must have a means for transforming parsed DOM fragments into equivalent hierarchies of plain Objects.

Alas, due to a well known sort of "impedance mismatch", this problem has no general solution. While JS[ON] data model is nearly ideal for business logic, XML DOM has some extra degrees of freedom that make the automatic conversion impossible. There is no way to map *mixed content* (distinguishable sequential text fragments intermitted by sibling elements–all this inside a parent element having attributes) to a plain JSON Object without either losing data or bloating the result with redundant elements requiring an immediate transformation to clean them up.

`node-xml-toolkit` takes a practical approach to this problem: if offers a solution that works for most _data centric_ XML (like DB dumps–opposed to _document centric_ things like [OOXML](https://ooxml.info/docs/)).

## 5.1 Usage Pattern
### Direct invocation on a parsed node

```javascript
const { XMLParser, XMLNode } = require('xml-toolkit')

const parser = new XMLParser()
const doc = parser.process('<root><item id="1"><value>3.14<value></item></root>')

const result = XMLNode.toObject({ wrap: true })(doc)
// result: { root: { item: { id: "1", "value": "3.14" } } }
```

> **Clarification**: Despite its name, `XMLNode.toObject()` is not an instance method on `XMLNode`. It is a standalone function exported for convenience, designed primarily to serve as a mapper function for `XMLReader`.

### As a mapper for XMLReader

```javascript
const { XMLReader, XMLNode } = require('xml-toolkit')

const reader = new XMLReader({
  stripSpace: true,
  collect: e => true,
  filterElements: 'MessagePrimaryContent',
  map: XMLNode.toObject({
    // options here
  })
})

for await (const obj of reader.process(stream)) {
  // obj is a plain JavaScript object
  console.log(obj)
}
```

> **Note**: When used directly, `XMLNode.toObject(options)` returns a function that accepts an `XMLNode` and returns the transformed object.

## 5.2 Options Reference

| Option | Default | Description |
|--------|---------|-------------|
| `wrap` | `false` | If `true`, output includes the root element name as a top-level key: `{ RootName: {...} }`. If `false` (default), only the content object is returned. |
| `getName` | `(localName, namespaceURI) => localName` | Function to transform XML element/attribute names into JavaScript object keys. Receives `localName` and `namespaceURI`; returns the desired property name. |
| `map` | `undefined` | If provided, a function applied to each resulting object (similar to `Array.prototype.map`). Useful for adding computed fields or normalizing structure. |

## 5.3 Transformation Rules
### Top-level element handling

By default, the root element's name is omitted from the output:

```xml
<MyElement><value>42</value></MyElement>
```

```javascript
// wrap: false (default)
→ { value: "42" }

// wrap: true
→ { MyElement: { value: "42" } }
```

This default avoids redundant wrapping when the root name is a known constant in your application logic.

### Attributes

Attributes become direct key-value pairs on the element's content object. Values are always strings (no automatic type coercion):

```xml
<Item id="123" status="active"/>
```

```javascript
→ { id: "123", status: "active" }
```

### Text content

If an element contains only text (no attributes or child elements), the result is the trimmed string value:

```xml
<Name>John Doe</Name>
```

```javascript
→ "John Doe"
```

> ⚠️ **Limitation**: Elements that mix text content with attributes or child elements cannot be represented unambiguously. The encoder does not support mixed content; such structures may produce unexpected results.

### Child elements: singletons vs. collections

- **Multiple same-name children** → array:
  ```xml
  <List><item>A</item><item>B</item></List>
  ```
  ```javascript
  → { item: ["A", "B"] }
  ```

- **Single child element** → scalar value:
  ```xml
  <User><id>42</id></User>
  ```
  ```javascript
  → { id: "42" }
  ```

- **Schema-aware arrays**: If the XML was parsed with schema context and an element is declared with `maxOccurs > 1`, it is always represented as an array—even if only one instance appears:
  ```xml
  <!-- Schema: <xsd:element name="tag" maxOccurs="unbounded"/> -->
  <Data><tag>only-one</tag></Data>
  ```
  ```javascript
  → { tag: ["only-one"] }
  ```

### Scalar values and null handling

- All leaf values are either `null` or trimmed, non-empty strings.
- Empty strings (`""`) are converted to `null`:
  ```xml
  <Field value=""/>
  ```
  ```javascript
  → { value: null }
  ```
- Empty elements (`<Empty/>` or `<Empty></Empty>`) yield `null`:
  ```javascript
  // wrap: false
  → null
  // wrap: true
  → { Empty: null }
  ```
- No automatic parsing of numbers, booleans, or dates occurs. `"42"` remains a string; `"true"` remains a string.

### Namespace handling

By default, namespaces are ignored: only the local name is used for object keys:

```xml
<x:Product x:code="XYZ" xmlns:x="urn:example"/>
```

```javascript
→ { code: "XYZ" }  // namespace URI and prefix discarded
```

To preserve namespace information, customize the `getName` option:

```javascript
XMLNode.toObject({
  getName: (localName, namespaceURI) => 
    namespaceURI ? `{${namespaceURI}}${localName}` : localName
})
```

```javascript
→ { "{urn:example}code": "XYZ" }
```

## 5.4 Practical Examples

### Example 1: Extracting a flat record list

```xml
<Export>
  <Record id="1" name="Alpha"/>
  <Record id="2" name="Beta"/>
</Export>
```

```javascript
const { XMLReader, XMLNode } = require('xml-toolkit')

const records = new XMLReader({
  filterElements: 'Record',
  map: XMLNode.toObject() // default: no wrap, attributes merged
})

for await (const rec of records.process(fs.createReadStream('data.xml'))) {
  // rec = { id: "1", name: "Alpha" }
  console.log(rec)
}
```

### Example 2: Adding a computed field via `map`

```javascript
const mapper = XMLNode.toObject({
  map: obj => ({ ...obj, processedAt: new Date().toISOString() })
})

const result = mapper(parsedNode)
// { id: "1", name: "Alpha", processedAt: "2026-04-24T..." }
```

### Example 3: Preserving element names with `wrap`

```javascript
const mapper = XMLNode.toObject({ wrap: true })

const result = mapper(parsedNode)
// { Record: { id: "1", name: "Alpha" } }
```

Useful when the element name carries semantic meaning that should travel with the data.

### Example 4: Normalizing names with `getName`

```javascript
const mapper = XMLNode.toObject({
  getName: (localName) => localName.toLowerCase()
})

// Input: <UserProfile><FirstName>Ada</FirstName></UserProfile>
// Output: { firstname: "Ada" }
```

