const CLASS_MAP = {
	'all':      require ('./MatchAll'),
	'choice':   require ('./MatchChoice'),
	'element':  require ('./MatchElement'),
	'sequence': require ('./MatchSequence'),
}

class Occurable {

	node	

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

			this.node = node

			this.type = node.localName		

			for (const k of ['minOccurs', 'maxOccurs']) this [k] = this.getOccurs (k)

			this.scan ()

		}

	}

	getOccurs (k) {

		const {attributes} = this.node; if (!(k in attributes)) return 1

		const v = attributes [k]; return v === 'unbounded' ? Infinity : parseInt (v)

	}

	scan () {

		for (const node of this.node.children) switch (node.localName) {
			case 'all':
			case 'choice':
			case 'sequence':
			case 'element':
				this.children.push (new Occurable (node))
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