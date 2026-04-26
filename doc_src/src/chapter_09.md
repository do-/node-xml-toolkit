# 9. SOAP Fundamentals in node-xml-toolkit

The `node-xml-toolkit` library provides first-class support for SOAP web services through dedicated classes that bridge the gap between plain JavaScript objects and the XML-based SOAP protocol. Unlike many Node.js SOAP libraries that wrap external dependencies, `node-xml-toolkit` implements SOAP functionality using its own XML parsing and serialization infrastructure, maintaining the library's core philosophy of minimal dependencies and maximum control.

This section introduces the foundational concepts for working with SOAP in `node-xml-toolkit`, covering WSDL interpretation, version support, and message construction patterns.

## 9.1 WSDL interpretation and service discovery

At the heart of SOAP integration in `node-xml-toolkit` is the ability to parse and interpret WSDL (Web Services Description Language) documents. When you instantiate a `SOAP11` or `SOAP12` client with a WSDL file path, the library performs several discovery steps automatically:

```javascript
const {SOAP11} = require('xml-toolkit')
const soap = new SOAP11('service.wsdl')
```

### How WSDL parsing works

1. **Schema loading**: The constructor loads the WSDL file using `XMLSchemata`, which parses the document into an internal tree representation of `XMLNode` objects.

2. **Definition extraction**: The library scans the parsed document for `<wsdl:definitions>` elements (namespace `http://schemas.xmlsoap.org/wsdl/`) and stores them in the `definitions` array for later lookup.

3. **Metadata indexing**: Several helper methods enable service discovery without manual XML traversal:

| Method | Purpose | Returns |
|--------|---------|---------|
| `getMessageLocalNameByElementLocalName(elementName)` | Maps a request element name to its containing `<wsdl:message>` | Message name string |
| `getOperationNameByMessageLocalName(messageName)` | Finds the `<wsdl:operation>` that uses a given message | Operation name string |
| `getSoapActionByOperationName(operationName)` | Retrieves the `soapAction` HTTP header value for an operation | SOAPAction string |
| `getSoapActionByElementLocalName(elementName)` | Convenience method: element name → SOAPAction | SOAPAction string |

These methods enable a declarative workflow: you provide a plain JavaScript object keyed by your request element name, and the library automatically determines the correct SOAPAction header and message structure.

### Service discovery pattern

```javascript
// Given a WSDL with a method accepting <GetUser> elements:
const requestPayload = {GetUser: {userId: '12345'}}
const {method, headers, body} = soap.http(requestPayload)
// headers.SOAPAction is automatically populated from WSDL metadata
```

> **Note**: WSDL parsing in `node-xml-toolkit` focuses on the structural metadata needed for message construction. Advanced WSDL features like complex binding configurations or policy assertions are not fully interpreted—this aligns with the library's "forever beta" stance on XML Schema and WSDL support.

## 9.2 SOAP 1.1 vs. SOAP 1.2 support

`node-xml-toolkit` provides separate classes for each major SOAP version, reflecting their distinct protocol requirements:

### SOAP 1.1 (`SOAP11` class)

- **Namespace**: `http://schemas.xmlsoap.org/soap/envelope/`
- **Content-Type**: `text/xml; charset=utf-8` [[4]]
- **Fault structure**: Uses `faultcode`, `faultstring`, `faultactor`, and `detail` elements
- **SOAPAction header**: Required; extracted from WSDL `<soap:operation soapAction="...">` or WS-Addressing `Action` attribute [[4]]

### SOAP 1.2 (`SOAP12` class)

- **Namespace**: `http://www.w3.org/2003/05/soap-envelope`
- **Content-Type**: `application/soap+xml; charset=utf-8` [[4]]
- **Fault structure**: Uses `Code`, `Reason`, `Role`, and `Detail` with nested `Value`/`Text` elements
- **SOAPAction header**: Not required by spec; header management is simplified

### Version selection

Use the factory helper for dynamic version selection:

```javascript
const {SOAP} = require('xml-toolkit')
const SoapClient = SOAP('1.1') // or '1.2'
const client = new SoapClient('service.wsdl')
```

### Fault handling consistency

Both classes expose a static `createError()` method that generates HTTP 500 errors with properly formatted SOAP Fault bodies, enabling consistent server-side error responses:

```javascript
const {SOAP11} = require('xml-toolkit')
// In an Express route handler:
if (validationFailed) {
  throw SOAP11.createError({
    code: 'Client',
    message: 'Invalid request format',
    detail: {errors: ['missing userId']}
  })
}
```

## 9.3 Message construction and encoding

The primary interface for building SOAP messages is the `http()` method, which transforms a plain JavaScript object into a complete HTTP request configuration.

### Basic message construction

```javascript
const {SOAP11} = require('xml-toolkit')
const soap = new SOAP11('service.wsdl')

const {method, headers, body} = soap.http({
  CreateUser: {
    username: 'alice',
    email: 'alice@example.com'
  }
})

// Result:
// method: 'POST'
// headers: {
//   'Content-Type': 'text/xml; charset=utf-8',
//   'SOAPAction': 'http://example.com/CreateUser' // auto-extracted
// }
// body: '<soap:Envelope>...<CreateUser>...</CreateUser>...</soap:Envelope>'
```

### How serialization works

1. **Object → XML**: The request payload is serialized using `XMLSchemata.stringify()`, which leverages the WSDL's embedded XML Schema definitions to produce namespace-aware, schema-compliant XML.

2. **Envelope wrapping**: The serialized body element is wrapped in a `<soap:Envelope>` with optional `<soap:Header>` support:
   ```javascript
   // With custom header:
   const header = {Security: {Token: 'abc123'}}
   const {body} = soap.http({CreateUser: {...}}, header)
   ```

3. **Encoding declaration**: UTF-8 is used by default; the XML declaration is included in the envelope [[4]].

### Decoding responses with SOAPEncoding

For responses using SOAP encoding styles (e.g., `soapenc:Array`, `soap:Map`), the `SOAPEncoding` helper decodes XML nodes back to JavaScript values:

```javascript
const {SOAPEncoding} = require('xml-toolkit')
const decoder = new SOAPEncoding({emptyScalar: null})

// Given a parsed XMLNode from a SOAP response:
const result = decoder.decode(responseNode)
// Handles xsi:nil, xsi:type, soapenc:Array, soap:Map automatically
```

Supported decoding rules [[4]]:
- `xsi:nil="true"` → `null`
- `xsi:type="xs:string"` → string value
- `soapenc:Array` → JavaScript array
- `soap:Map` → JavaScript object with key/value pairs

