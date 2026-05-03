---
layout: default
title: "XML Schema Definition"
---
# Working with XML Schema

* toc
{:toc}

In `node-xml-toolkit`, [XML Schema Definitions](https://www.w3.org/TR/xmlschema11-1/) are used two ways:
* as logical conditions to [check](../XMLParser#validation-using-xml-schema) while [reading](../read) XML,
* and as a kind of [templates](../XMLMarshaller) for [writing](../write) it.

In this chapter, some common aspects are covered.

## Clarification on Naming

The term *"XML Schema"* describes a logical structure belonging to a single namespace. But virtually every real world application using this technology describes multiple related namespaces, each with its own schema, though referring each other.

That's why you never work with an isolated *schema*, but with a roster: one schema per namespace. In `node-xml-toolkit`, such roster is implemented via the class named [`XMLSchemata`](https://github.com/do-/node-xml-toolkit/wiki/XMLSchemata).

> **Note**: [*"Schemata"*](https://dictionary.cambridge.org/us/dictionary/english/schemata) is the original plural for *"Schema"*, as borrowed from the Greek.

[`XMLSchema`](https://github.com/do-/node-xml-toolkit/wiki/XMLSchema) exists too, but for internal use only. It's never mentioned elsewhere is this guide.

## Loading

The API is pretty straightforward here:

```javascript
const { XMLSchemata } = require('xml-toolkit');
const schemata = new XMLSchemata('schemas/catalog.xsd');
```

## Synchronous Mode, Local Files only

As of this writing, the only way to point the root XSD file is to pass it to the `XMLSchemata` constructor. 

So the process is synchronous, [`<xs:import>`](https://www.w3.org/TR/xmlschema11-1/#composition-schemaImport) and [`<xs:include>`](https://www.w3.org/TR/xmlschema11-1/#compound-schema) work only with file `schemaLocation`s. No HTTP nor similar network locations are supported yet.