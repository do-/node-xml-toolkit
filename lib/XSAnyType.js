const Occurable = require ('./validation/Occurable')

module.exports = class {

	#isAnyAttributeAllowed = false
	#isExtended = false
	#parent = null

	get isAnyAttributeAllowed () {

		return this.#isAnyAttributeAllowed

	}

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

		this.elements = this.#parent.elements.concat (this.elements)

		this.content = new Occurable ([this.#parent.content, this.content])

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

			case 'all':
			case 'choice':
			case 'sequence':
				this.content ??= new Occurable (node, this.xs)
				break

			case 'extension': 
				this.#isExtended = true
			case 'restriction': 
				this.#parent = this.xs.getAnyType (this.xs.getType (node.attributes.base))

		}

		for (const child of node.children) this.scan (child)

	}

}