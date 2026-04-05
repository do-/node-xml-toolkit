const {XSINamespace} = require ('../NamespacesMap')
const XMLMessages = require ('../XMLMessages')

class XMLValidationState {

	#child = null
	#hadText = false

	constructor (parent, parsedNode, elementDefinition) {

		const xs = this.xs = (this.parent = parent).xs
		this.parsedNode = parsedNode

		const typeDefinition = xs.getTypeDefinition (elementDefinition)

		this.anyType = xs.getAnyType (typeDefinition)

		this.validateAttributes (this.parsedNode.attributes)

		const {content} = this.anyType; if (content) this.match = content.createMatch ()

	}

	warn (message, cause) {

		this.parent.warn (message, cause)

	}

	blameNothingExpected () {

		this.warn (['XVC-00001', this.parsedNode.src])

	}

	blameUnexpectedTag (parsedNode, match) {

		const expected = match.allExpected (parsedNode); if (expected == null) this.blameNothingExpected ()

		this.warn (['XVC-00002', expected])

	}

	startElement (parsedNode) {

		if (this.#child !== null) return this.#child.startElement (parsedNode)

		const {match} = this; if (!match) this.warn (['XVC-00001', this.anyType.debugQName])

		const element = match.getElementDefinition (parsedNode); if (!element) this.blameUnexpectedTag (parsedNode, match)

		if (element.localName === 'any') return

		this.#child = new XMLValidationState (this, parsedNode, element)

	}

	endElement (parsedNode) {

		if (this.#child === null) {

			if (!this.#hadText) this.characters ('')

			const {match} = this; if (match && !match.isSatisfied) this.blameUnexpectedTag (parsedNode, match)
			
			return null

		}

		this.#child = this.#child.endElement (parsedNode)

		return this

	}

	characters (text) {

		if (this.#child !== null) return this.#child.characters (text)

		this.#hadText = true

		this.validateScalar (text, this.anyType.asSimpleType ())

	}

	validateScalar (value, type) {

		const result = type.test (value ?? '')

		if (result) this.warn (result)

	}

	resolveAttribute (name, attributesMap) {

		const {attributes} = this.anyType

		if (attributes.has (name)) {

			const def = attributes.get (name)

			if (!def.targetNamespace || def.targetNamespace === attributesMap.getNamespaceURI (name)) return def

		}

		const localName = attributesMap.getLocalName (name); if (localName === name) return null

		const def = attributes.get (localName); if (!def) return null

		if (def.targetNamespace !== attributesMap.getNamespaceURI (name)) return null

		return def

	}

	validateAttributes (attributesMap) {

		const {attributes, isAnyAttributeAllowed} = this.anyType

		const matched = new Set ()

		for (const [name, value] of attributesMap) {

			const def = this.resolveAttribute (name, attributesMap)

			if (!def) {

				if (isAnyAttributeAllowed) continue

				if (attributesMap.getNamespaceURI (name) === XSINamespace) continue

				this.warn (['XVC-00003', name])

			}

			matched.add (def)

			const {attributes: {fixed, type}} = def

			if (typeof fixed === 'string' && value !== fixed) this.warn (['XVC-00004', name, fixed, value])

			if (type) {

				this.validateScalar (value, this.xs.getSimpleType (this.xs.getType (type)))

			}
			else {

				for (const node of def.children)

					this.validateScalar (value, this.xs.getSimpleType (node))

			}

		}

		for (const [name, def] of attributes) if (!matched.has (def)) {

			if (def.attributes.use === 'required') this.warn (['XVC-00005', name])

			if ('default' in def.attributes) attributesMap.set (name, def.attributes.default)

		}

	}

}

module.exports = XMLValidationState