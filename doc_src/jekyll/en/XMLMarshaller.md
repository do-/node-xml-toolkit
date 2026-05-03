---
layout: default
title: "Schema aware XMLMarshaller"
---
# Schema-Driven Serialization with XMLMarshaller

* toc
{:toc}

Loosely based on the [JAXB Marshaller](https://docs.oracle.com/javase/8/docs/api/javax/xml/bind/Marshaller.html) idea (more specifically, [MOXy's `JAXBMarshaller`](https://docs.oracle.com/middleware/1213/toplink/java-reference/org/eclipse/persistence/jaxb/JAXBMarshaller.html) with [`MEDIA_TYPE="application/json"`](https://docs.oracle.com/middleware/1213/toplink/java-reference/org/eclipse/persistence/jaxb/MarshallerProperties.html#MEDIA_TYPE)), this class transforms plain objects into valid XML. Think the opposite of [XMLParser](../XMLParser) + [XMLNode.toObject](../XMLNode.toObject).

## Basic usage

`XMLMarshaller` instances are created using [XML Schema](../XMLSchemata) as a factory. Then, its `.stringify()` method is used in the application code.

```javascript
const {XMLSchemata} = require ('xml-toolkit')

const xs         = new XMLSchemata ('orders.xsd')
const marshaller = xs.createMarshaller (
    'Order',              // localName
    // 'http://tempuri.org', // namespaceURI
    // {
    //   space: '  ',        // XMLPrinter option(s)
    // }
)

const orderData = {
  id: 'ORD-9921',
  status: 'pending',
  customer: {
    name: 'Acme Corp',
    contact: 'ops@acme.example.com'
  },
  items: [
    { sku: 'WDG-01', quantity: 5, unitPrice: 12.50 },
    { sku: 'WDG-02', quantity: 2, unitPrice: 45.00 }
  ]
};

const xml = marshaller.stringify(orderData);
```

Both `XMLMarshaller` and `XMLSchemata` are fairly heavy objects, but, being stateless, allow unrestricted reusing.

## How the mapper interprets objects

| JavaScript construct | XML mapping behavior |
|----------------------|----------------------|
| String/Number/Boolean | Converted to text content of the enclosing element |
| Nested Object | Serialized as a child element |
| Array / Readable Stream | Each item becomes a sibling element with the parent key's name |
| `null` / `undefined` | Omitted entirely (when `minOccurs="0"`) or `xsi:nil` (for `nillable` elements) |
| Dates (`Date` objects) | Serialized according to `xs:date` or `xs:dateTime` format rules |

XML distinguishes between child elements and attributes, while JavaScript objects do not which may lead to collisions. On the other hand, a schema allowing element like

```xml
  <object id="1"> <!-- `id` as an attribute -->
    <id>2</id>    <!-- `id` as a child element -->
  </object>
```

seems extremely unlikely to be used in a real application. As of this writing, `XMLMarshaller` does nothing to address this potential issue.

The same logic applies to possible namespace conflicts.

## More on Streams

As noted above, sets of sibling nodes can be produced not only from fixed arrays, but from [Readable streams](https://nodejs.org/docs/latest/api/stream.html#readable-streams) too.

In the latter case, the marshalling process becomes naturally asynchronous. And, for a stream source, you have to provide a stream destination: via the `out` option.

Still, the `.stringify()` call stays the same: with streams, it acts just like [pipe()](https://nodejs.org/docs/latest/api/stream.html#readablepipedestination-options). You just wait for your `out` stream to be closed:

```js
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
```

## Type coercion and validation during marshalling

The marshaller *partially* validates your JavaScript data against the schema before generating XML. Fatal type mismatches are caught early:

```javascript
// Schema expects xs:integer for quantity, but receives a string
const badItem = { sku: 'WDG-01', quantity: 'five', unitPrice: 12.50 };

try {
  marshaller.stringify({ items: [badItem] }, 'Order');
} catch (err) {
  console.error (err)
}
```

It worth bearing in mind that `XMLMarshaller` considers the XML schema as a blueprint for generating text, not as a set of rules to ensure strictly. So it emits validation errors only in cases when there is no chance to serialize a value: say a Boolean as a timestamp. For most non-textual values, the default `String()` conversion is used, so the output may occur to be invalid in terms of the schema. Ultimately, the proper formatting of numbers, dates etc. is left on the developer's responsibility.