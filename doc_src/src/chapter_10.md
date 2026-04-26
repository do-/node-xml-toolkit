# 10. Invoking SOAP Services

With the SOAP fundamentals established in the previous section, this chapter walks through the practical workflow for invoking SOAP web services using `node-xml-toolkit`. The library's approach emphasizes minimal abstraction: you construct the HTTP request configuration, then use Node.js's native `http` or `https` modules to transmit it. This design keeps dependencies low while giving you full control over transport-layer behavior like timeouts, retries, and connection pooling .

## 10.1 Creating a SOAP client from WSDL

The entry point for SOAP integration is instantiating either `SOAP11` or `SOAP12` with a path to a WSDL document:

```javascript
const {SOAP11} = require('xml-toolkit')

// Load and parse the WSDL at construction time
const soap = new SOAP11('service.wsdl')
```

### What happens during construction

1. **WSDL parsing**: The constructor creates an internal `XMLSchemata` instance to parse the WSDL file into a tree of `XMLNode` objects.

2. **Definition indexing**: The client scans for `<wsdl:definitions>` elements (namespace `http://schemas.xmlsoap.org/wsdl/`) and stores them in the `definitions` array for metadata lookups.

3. **Schema caching**: The embedded SOAP envelope schema (`soap-1.1.xsd` or `soap-1.2.xsd`) is loaded once and cached statically for message validation.

### Reusing clients

Because WSDL parsing occurs only once at construction, you should reuse SOAP client instances across requests:

```javascript
// ✅ Recommended: singleton or module-level instance
const soapClient = new SOAP11('service.wsdl')

module.exports = {
  callService: async (payload) => {
    const {method, headers, body} = soapClient.http(payload)
    // ... send request
  }
}
```

> **Note**: The WSDL file path is resolved relative to the caller's working directory. For production deployments, consider using `path.join(__dirname, 'wsdl/service.wsdl')` for reliable resolution.

## 10.2 Building request payloads from plain objects

The `http()` method is the primary interface for constructing SOAP requests. It accepts a plain JavaScript object and returns a complete HTTP request configuration.

### Basic payload structure

```javascript
const {method, headers, body} = soap.http({
  GetUser: {              // ← Request element name from WSDL
    userId: '12345',      // ← Child elements become XML children
    includeProfile: true
  }
})
```

### How the transformation works

1. **Element name resolution**: The library uses the object's top-level key (`GetUser`) to:
   - Locate the corresponding `<wsdl:message>` in the parsed WSDL
   - Extract the `soapAction` HTTP header value via `getSoapActionByElementLocalName()` 

2. **Schema-based serialization**: The payload object is passed to `XMLSchemata.stringify()`, which uses the WSDL's embedded XML Schema definitions to produce namespace-aware, schema-compliant XML.

3. **Envelope wrapping**: The serialized body element is wrapped in a `<soap:Envelope>` with proper namespace declarations:

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetUser xmlns="urn:service:types">
      <userId>12345</userId>
      <includeProfile>true</includeProfile>
    </GetUser>
  </soap:Body>
</soap:Envelope>
```

### Dynamic SOAPAction resolution

The library automatically populates the `SOAPAction` header by traversing the WSDL metadata:

```javascript
// Internal lookup chain:
// element name → message name → operation name → soapAction attribute
headers.SOAPAction = soap.getSoapActionByElementLocalName('GetUser')
// Returns: "http://example.com/GetUser" (from WSDL)
```

If the WSDL lacks explicit `soapAction` attributes, the client falls back to WS-Addressing `Action` attributes or returns an empty string.

## 10.3 Sending requests with Node.js http/https

Once you have the `{method, headers, body}` configuration, use Node.js's built-in HTTP modules to transmit the request.

### Basic HTTP request

```javascript
const http = require('http')
const {SOAP11} = require('xml-toolkit')

const soap = new SOAP11('service.wsdl')
const endpoint = 'http://api.example.com/soap'

const {method, headers, body} = soap.http({
  CreateUser: {username: 'alice', email: 'alice@example.com'}
})

const req = http.request(endpoint, {method, headers}, (res) => {
  let data = ''
  res.setEncoding('utf8')
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('Response body:', data)
      // Parse response XML here (see Section 11.4)
    } else {
      console.error('HTTP error:', res.statusCode, data)
    }
  })
})

req.on('error', (err) => console.error('Request failed:', err))
req.write(body)
req.end()
```

### HTTPS with TLS options

For secure endpoints, use the `https` module with custom TLS configuration:

```javascript
const https = require('https')
const fs = require('fs')

const {method, headers, body} = soap.http({SecureOperation: {...}})

const req = https.request('https://api.example.com/soap', {
  method,
  headers,
  key: fs.readFileSync('client-key.pem'),
  cert: fs.readFileSync('client-cert.pem'),
  ca: [fs.readFileSync('ca-cert.pem')]
}, handleResponse)

req.write(body)
req.end()
```

## 10.4 Parsing and handling responses and faults

After sending a request, you'll need to parse the SOAP response and handle potential faults. The library provides utilities for both tasks.

### Parsing successful responses

Use `XMLParser` for small responses or `XMLReader` for streaming large responses:

```javascript
const {XMLParser} = require('xml-toolkit')

// Parse the response body string
const parser = new XMLParser()
const responseDoc = parser.process(responseBody)

// Navigate to the response element
const result = responseDoc.children
  .find(n => n.localName === 'GetUserResponse')
  ?.children
  ?.find(n => n.localName === 'userData')

if (result) {
  const userData = XMLNode.toObject({})(result) // Convert to plain JS object
  console.log('User data:', userData)
}
```

### Decoding SOAP-encoded values

For responses using SOAP encoding styles (`soapenc:Array`, `soap:Map`), use the `SOAPEncoding` helper:

```javascript
const {SOAPEncoding, XMLParser} = require('xml-toolkit')

const decoder = new SOAPEncoding({emptyScalar: null})
const parser = new XMLParser()
const responseDoc = parser.process(responseBody)

// Find the encoded element (e.g., xsi:type="soapenc:Array")
const encodedNode = responseDoc.children
  .find(n => n.attributes.get('type', 'http://www.w3.org/2001/XMLSchema-instance')?.includes('Array'))

if (encodedNode) {
  const decoded = decoder.decode(encodedNode)
  console.log('Decoded array:', decoded) // Now a native JavaScript array
}
```

Supported decoding rules [[2]]:
| XML Attribute | JavaScript Result |
|--------------|------------------|
| `xsi:nil="true"` | `null` |
| `xsi:type="xs:string"` | String value |
| `soapenc:Array` | JavaScript `Array` |
| `soap:Map` | JavaScript `Object` with key/value pairs |

### Handling SOAP faults

When a service returns a fault, the response body contains a `<soap:Fault>` element. You can detect and parse it manually, or use the library's `SOAPFault` helper:

```javascript
const {SOAP11, XMLParser} = require('xml-toolkit')

if (res.statusCode !== 200) {
  const parser = new XMLParser()
  const faultDoc = parser.process(responseBody)
  
  const faultNode = faultDoc.children
    .find(n => n.localName === 'Fault')
  
  if (faultNode) {
    // Extract fault details
    const faultCode = faultNode.children
      .find(n => n.localName === 'faultcode')?.src
    const faultString = faultNode.children
      .find(n => n.localName === 'faultstring')?.src
    
    console.error(`SOAP Fault [${faultCode}]: ${faultString}`)
    throw new Error(`SOAP Error: ${faultString}`)
  }
}
```

