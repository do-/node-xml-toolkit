# 11. Implementing a SOAP Service (Server-Side)

While `node-xml-toolkit` is often used as a SOAP client, its architecture is equally suited for implementing server-side SOAP endpoints. The same `SOAP11` and `SOAP12` classes that build outbound requests can also construct compliant response envelopes, and the library's schema-aware serialization ensures your replies match the WSDL contract. This section covers the complete server-side workflow: receiving requests, validating payloads, constructing responses, and handling faults.

> **Design note**: The library intentionally avoids high-level server abstractions (like Express middleware wrappers). Instead, it provides low-level, composable primitives that integrate cleanly with any Node.js HTTP framework—aligning with the project's philosophy of minimal dependencies and maximum control.

## 11.1 Receiving and parsing SOAP requests

When a SOAP request arrives at your endpoint, the first step is to parse the XML envelope and extract the body payload. `node-xml-toolkit` offers two parsing strategies depending on payload size and performance requirements.

### Parsing with XMLParser (small/medium payloads)

For typical request sizes (<10MB), the synchronous `XMLParser` provides the simplest workflow:

```javascript
const {XMLParser, SOAP11} = require('xml-toolkit')

app.post('/soap', (req, res) => {
  let body = ''
  req.setEncoding('utf8')
  req.on('data', chunk => body += chunk)
  req.on('end', () => {
    try {
      // Parse the full SOAP envelope
      const parser = new XMLParser()
      const envelope = parser.process(body)
      
      // Navigate to the SOAP Body
      const soapNs = 'http://schemas.xmlsoap.org/soap/envelope/'
      const soapBody = envelope.children
        .find(n => n.localName === 'Body' && n.namespaceURI === soapNs)
      
      if (!soapBody) {
        throw new Error('Missing SOAP Body')
      }
      
      // Extract the operation element (first child of Body)
      const operation = soapBody.children[0]
      const operationName = operation.localName
      
      console.log(`Received ${operationName} request`)
      
      // Convert to plain object for business logic
      const payload = operation.toObject({})
      
      // ... process payload ...
      
    } catch (err) {
      console.error('Parse error:', err.message)
      res.status(400).send('Malformed request')
    }
  })
})
```

### Streaming with XMLReader (large payloads)

For large request bodies or when you need to filter specific elements, use the asynchronous `XMLReader`:

```javascript
const {XMLReader, XMLNode} = require('xml-toolkit')

app.post('/soap/bulk', async (req, res) => {
  try {
    // Stream only the <Record> elements from the request body
    const records = new XMLReader({
      filterElements: 'Record',
      map: XMLNode.toObject({})
    }).process(req)
    
    const results = []
    for await (const record of records) {
      // Process each record incrementally
      const processed = await businessLogic(record)
      results.push(processed)
    }
    
    // Send response (see Section 12.3)
    sendSoapResponse(res, {BulkProcessResponse: {results}})
    
  } catch (err) {
    console.error('Streaming error:', err)
    res.status(500).send('Processing failed')
  }
})
```

### Extracting SOAP headers

If your service requires WS-Security or custom headers, extract them during parsing:

```javascript
// After parsing the envelope:
const soapHeader = envelope.children
  .find(n => n.localName === 'Header' && n.namespaceURI === soapNs)

if (soapHeader) {
  const security = soapHeader.children
    .find(n => n.localName === 'Security')
  
  if (security) {
    const token = security.children
      .find(n => n.localName === 'Token')?.src
    
    // Validate token...
  }
}
```

> **Tip**: Use `XMLNode.getLocalName()` and `attributes.get()` for namespace-safe attribute access, as shown in the library's WSDL parsing logic.

---

## 11.2 Validating incoming messages against schema

Schema validation ensures incoming requests conform to your WSDL contract. `node-xml-toolkit` supports validation through `XMLSchemata`, which can be initialized with your service's WSDL or standalone XSD files.

### Loading schema for validation

```javascript
const {XMLParser, XMLSchemata} = require('xml-toolkit')

// Load WSDL at server startup (cache for performance)
const schemata = new XMLSchemata('service.wsdl')

app.post('/soap', (req, res) => {
  // ... receive body ...
  
  const parser = new XMLParser({xs: schemata})
  const envelope = parser.process(body)
  
  // Check for validation messages after parsing
  if (parser.validationMessages.length > 0) {
    const errors = parser.validationMessages
    
    if (errors.length > 0) {
      // Return SOAP Fault (see Section 12.4)
      return sendSoapFault(res, {
        code: 'Client',
        message: 'Schema validation failed',
        detail: {errors}
      })
    }
  }
  
  // Proceed with valid request...
})
```

## 11.3 Constructing and sending SOAP responses

Once your business logic completes, use the `SOAP11` or `SOAP12` class to build a compliant response envelope. The same `http()` method used for client requests works symmetrically for server responses.

### Basic response construction

```javascript
const {SOAP11} = require('xml-toolkit')

function sendSoapResponse(res, payload, header = null) {
  const soap = new SOAP11('service.wsdl') // WSDL for schema-aware serialization
  
  // Build the SOAP envelope
  const {body} = soap.http(payload, header)
  
  // Send with correct headers
  res.status(200)
    .set('Content-Type', SOAP11.contentType + '; charset=utf-8')
    .send(body)
}

// Usage in route handler:
sendSoapResponse(res, {
  GetUserResponse: {
    userData: {
      userId: '12345',
      email: 'alice@example.com',
      active: true
    }
  }
})
```

### How serialization works

1. **Schema-aware stringification**: The payload object is passed to `XMLSchemata.stringify()`, which uses the WSDL's embedded XML Schema to produce namespace-correct XML [[2]].

2. **Envelope wrapping**: The serialized body element is wrapped in a `<soap:Envelope>` with proper namespace declarations:
   ```xml
   <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
     <soap:Body>
       <GetUserResponse xmlns="urn:service:types">
         <userData>
           <userId>12345</userId>
           <!-- ... -->
         </userData>
       </GetUserResponse>
     </soap:Body>
   </soap:Envelope>
   ```

3. **Header support**: Optional SOAP headers (e.g., WS-Addressing `ReplyTo`) are passed as the second argument to `http()`:
   ```javascript
   const header = {
     ReplyTo: {
       Address: 'http://client.example.com/callback'
     }
   }
   sendSoapResponse(res, payload, header)
   ```

## 11.4 Error handling and SOAPFault generation

When errors occur, SOAP services must return properly formatted `<soap:Fault>` elements. `node-xml-toolkit` provides the `SOAPFault` class for structured fault data and the static `createError()` method for generating HTTP-compatible error responses.

### Using SOAPFault for structured errors

```javascript
const {SOAPFault} = require('xml-toolkit')

// Create a fault object with standard fields
const fault = new SOAPFault({
  code: 'Client',           // or 'Server', 'VersionMismatch', 'MustUnderstand'
  message: 'Invalid userId format',
  detail: {                 // Optional application-specific details
    field: 'userId',
    expected: 'numeric string',
    received: 'abc123!'
  }
})
```

### Generating HTTP error responses with createError()

The static `createError()` method returns an `http-errors` compatible object that sets the correct `Content-Type` header and includes the serialized `<soap:Fault>` XML:

```javascript
const {SOAP11} = require('xml-toolkit')

function sendSoapFault(res, faultOptions) {
  // createError() returns an Error-like object with .status, .headers, .message
  const error = SOAP11.createError(faultOptions)
  
  res.status(error.status)          // Always 500 for SOAP faults
    .set(error.headers)             // Sets Content-Type: text/xml; charset=utf-8
    .send(error.message)            // Serialized <soap:Fault> XML
}

// Usage:
if (!isValidUserId(userId)) {
  return sendSoapFault(res, {
    code: 'Client',
    message: 'userId must be a numeric string',
    detail: {field: 'userId', value: userId}
  })
}
```

### SOAP 1.1 vs. SOAP 1.2 fault structures

| Field | SOAP 1.1 | SOAP 1.2 |
|-------|----------|----------|
| **Element name** | `<faultcode>`, `<faultstring>` | `<Code>`, `<Reason>` |
| **Code format** | `faultcode` (qualified name) | `Code/Value` (nested) |
| **Actor/Role** | `<faultactor>` | `<Role>` |
| **Detail** | `<detail>` with custom XML | `<Detail>` with custom XML |
| **Language** | N/A | `Reason/Text[@xml:lang]` |

The library handles these differences automatically based on whether you use `SOAP11` or `SOAP12`:

```javascript
// SOAP 1.1 fault output:
// <soap:Fault>
//   <faultcode>Client</faultcode>
//   <faultstring>Invalid userId</faultstring>
//   <detail><errors>...</errors></detail>
// </soap:Fault>

// SOAP 1.2 fault output:
// <soap:Fault>
//   <Code><Value>Receiver</Value></Code>
//   <Reason><Text xml:lang="en">Invalid userId</Text></Reason>
//   <Detail><errors>...</errors></Detail>
// </soap:Fault>
```

### Complete error handling pattern

```javascript
const {SOAP11, XMLParser} = require('xml-toolkit')

app.post('/soap', async (req, res) => {
  try {
    // 1. Parse request
    const body = await readRequestBody(req)
    const parser = new XMLParser()
    const envelope = parser.process(body)
    
    // 2. Extract operation
    const operation = extractOperation(envelope)
    const payload = operation.toObject({})
    
    // 3. Business logic (may throw)
    const result = await processRequest(payload)
    
    // 4. Send success response
    sendSoapResponse(res, {
      [`${operation.localName}Response`]: result
    })
    
  } catch (err) {
    // 5. Map errors to SOAP faults
    if (err instanceof ValidationError) {
      return sendSoapFault(res, {
        code: 'Client',
        message: err.message,
        detail: err.details
      })
    }
    
    if (err instanceof AuthenticationError) {
      return sendSoapFault(res, {
        code: 'Client',
        message: 'Authentication failed',
        actor: 'http://service.example.com/auth'
      })
    }
    
    // Default: server error
    console.error('Unhandled error:', err)
    return sendSoapFault(res, {
      code: 'Server',
      message: 'Internal processing error',
      detail: process.env.NODE_ENV === 'development' ? {stack: err.stack} : undefined
    })
  }
})
```
