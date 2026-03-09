class Occurable {

	#node	

	constructor (arg) {

		this.children = []

		if (Array.isArray (arg)) {

			this.type = 'sequence'
			this.minOccurs = 1
			this.maxOccurs = 1

			for (const o of arg) {

				if (o.type === 'sequence' && o.minOccurs === 1 && o.maxOccurs === 1) {
					
					this.children = this.children.concat (o.children)
					
				}
				else {
					
					this.children.push (o)

				}

			}

		}
		else {

			const node = arg

			this.#node = node

			this.type = node.localName		

			for (const k of ['minOccurs', 'maxOccurs']) this [k] = this.getOccurs (k)

			this.scan ()

		}

	}

	getOccurs (k) {

		const {attributes} = this.#node; if (!(k in attributes)) return 1

		const v = attributes [k]; return v === 'unbounded' ? Infinity : parseInt (v)

	}

	scan () {

		for (const node of this.#node.children) switch (node.localName) {
			// case 'all':
			case 'choice':
			case 'sequence':
			case 'element':
				this.children.push (new Occurable (node))
				break
		}
			
	}

}

module.exports = Occurable