module.exports = class {

	#isAnyAttributeAllowed = false
	#isExtended = false
	#parent = null

	constructor (xs, node) {

		this.xs = xs
		this.node = node

		this.attributes = new Map ()
		this.elements   = []

		this.scan (node)

		if (this.#parent === null) return

		if (this.#isExtended) this.extend (); else this.restrict ()

	}

	extend () {

		this.attributes = new Map ([
			...this.#parent.attributes,
			...this.attributes
		])

		this.elements   = this.#parent.elements.concat (this.elements)

	}

	restrict () {

		this.attributes = new Map ([
			...this.#parent.attributes,
			...this.attributes
		])

	}

	asSimpleType () {

		return this.xs.getSimpleType (this.node)

	}

	get debugQName () {

		const {xs, node} = this

		return xs.getDebugQName (node.attributes.name, node.targetNamespace)

	}

	scan (node) {

		while (node.attributes.ref) node = this.xs.getByReference (node.attributes.ref)

		switch (node.localName) {

			case 'anyAttribute': return this.#isAnyAttributeAllowed = true

			case 'attribute': return this.attributes.set (node.attributes.name, node)

			case 'any':
			case 'element':
				return this.elements.push (node)

			case 'extension': 
				this.#isExtended = true
			case 'restriction': 
				this.#parent = this.xs.getAnyType (this.xs.getType (node.attributes.base))

		}

		for (const child of node.children) this.scan (child)

	}

	validateAttributes (attributesMap) {

		const {attributes} = this

		for (const [name, value] of attributesMap) {

			if (!attributes.has (name)) {

				if (this.#isAnyAttributeAllowed) continue

				throw Error (`Unknown attribute: "${name}"`)

			}
			
			const def = attributes.get (name), {attributes: {fixed, type}} = def

			if (typeof fixed === 'string' && value !== fixed) throw Error (`The attribute "${name}" must have the value "${fixed}", not "${value}"`)

			const validateBy = typeNode => {

				try {

					this.xs.getSimpleType (typeNode).validateScalar (value)

				}
				catch (cause) {

					throw Error (`attribute '${name}": ${cause.message}`, {cause})

				}

			}

			if (type) {

				validateBy (this.xs.getType (type))

			}
			else {

				for (const node of def.children) validateBy (node)

			}

		}

		for (const [name, def] of attributes) if (!attributesMap.has (name)) {

			if (def.attributes.use === 'required') throw Error (`Missing required attribute: "${name}"`)

			if ('default' in def.attributes) attributesMap.set (name, def.attributes.default)

		}

	}

}