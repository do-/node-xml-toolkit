const CLASS_MAP = {
	'all':      require ('./MatchAll'),
	'choice':   require ('./MatchChoice'),
	'element':  require ('./MatchElement'),
	'sequence': require ('./MatchSequence'),
}

const parseOccurs = v => v == null ? 1 : v === 'unbounded' ? Infinity : parseInt (v)

class Occurable {

	node

	constructor (arg, xs, minOccurs, maxOccurs) {

		if (xs) this.xs = xs

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

			this.node = node

			this.type = node.localName		

			this.minOccurs = parseOccurs (minOccurs ?? node.attributes ['minOccurs'])
			this.maxOccurs = parseOccurs (maxOccurs ?? node.attributes ['maxOccurs'])

			this.scan ()

		}

	}

	scan () {

		for (let node of this.node.children) switch (node.localName) {
			case 'all':
			case 'choice':
			case 'sequence':
			case 'element':
				const {minOccurs, maxOccurs} = node.attributes
				while ('ref' in node.attributes) node = this.xs.getByReference (node.attributes.ref)
				this.children.push (new Occurable (node, this.xs, minOccurs, maxOccurs))
				break
		}
			
	}

	createMatch () {

		const {type} = this, m = new CLASS_MAP [type] (this)
		
		if (type !== 'element') m.children = this.children.map (o => o.createMatch ())

		return m

	}

}

module.exports = Occurable