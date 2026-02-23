class XSComplexType {

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

	get debugQName () {

		const {xs, node} = this

		return xs.getDebugQName (node.attributes.name, node.targetNamespace)

	}

	scan (node) {

		switch (node.localName) {

			case 'attribute': return this.attributes.set (node.attributes.name, node)

			case 'element':   return this.elements.push (node)

			case 'extension': 
				this.#isExtended = true
			case 'restriction': 
				this.#parent = this.xs.getComplexType (this.xs.getType (node.attributes.base))

		}

		for (const child of node.children) this.scan (child)

	}

	validateAttributes (attributesMap) {

		const {attributes} = this

		for (const [name, value] of attributesMap) {

			if (!attributes.has (name)) throw Error (`Unknown attribute: "${name}"`)

		}

		for (const [name, {attributes: {use}}] of attributes)

			if (use === 'required' && !attributesMap.has (name))

				throw Error (`Missing required attribute: "${name}"`)

	}

}

module.exports = XSComplexType