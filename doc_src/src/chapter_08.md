# 8. Schema-Driven Serialization with XMLMarshaller

Generating XML from JavaScript objects is a common requirement in API clients, message brokers, and data export pipelines. However, producing structurally valid XML manually is error-prone. `XMLMarshaller` bridges this gap by using XML Schema (XSD) definitions to automatically transform plain JavaScript objects into well-formed, schema-compliant XML documents. This chapter covers schema loading, object mapping strategies, namespace handling, and troubleshooting techniques.

## 8.1 Loading and indexing XML Schema definitions

`XMLMarshaller` relies on `XMLSchemata` to understand the target structure, data types, and cardinality constraints. Proper schema management is the foundation of reliable serialization.

```javascript
const { XMLSchemata, XMLMarshaller } = require('xml-toolkit');
const schemata = new XMLSchemata('schemas/order.xsd');
```

Schema parsing and type resolution have upfront costs. In long-running applications (HTTP servers, workers, CLI tools processing multiple files), reuse a single `XMLSchemata` instance:

```javascript
// Application initialization
const globalSchemata = new XMLSchemata('schemas/order.xsd');

// Route handler or worker function
function someHandler() {
  const marshaller = globalSchemata.createMarshaller(
    'Order'                       // localName
    // , 'http://tempuri.org/'    // namespace URI, if available
  )
  // use the `marshaller` instance in this scope
}
```

This avoids redundant parsing, reduces startup latency, and ensures consistent type coercion across your application.

## 8.2 Mapping JavaScript objects to schema-compliant XML

The core challenge in XML serialization is the structural mismatch between JavaScript objects and XML trees. `XMLMarshaller` uses a deterministic mapping algorithm that interprets object keys as element names, handles arrays for repeated elements, and applies a convention for attributes.

### Basic object structure convention

```javascript
const marshaller = new XMLMarshaller({ schemata });

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

### How the mapper interprets objects

| JavaScript construct | XML mapping behavior |
|----------------------|----------------------|
| String/Number/Boolean | Converted to text content of the enclosing element |
| Nested Object | Serialized as a child element |
| Array of Objects/Primitives | Each item becomes a sibling element with the parent key's name |
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

### Type coercion and validation during marshalling

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

It worth bearing in mind that `XMLMarshaller` considers the XML schema as a blueprint for generating text, not as a set of rules to check. This is why validation errors occur only in cases when `XMLMarshaller` have completely no idea how to serialize a value: say a Boolean as a timestamp. For most non-textual values, the default `String()` conversion is used, so the output may occur to be invalid in ters of the schema. Ultimately, the proper formatting of numbers, dates etc. is left on the developer's responsibility.