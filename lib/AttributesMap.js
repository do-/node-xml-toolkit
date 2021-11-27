const AttributesMap = class extends Map {

	constructor (xmlReader) {

		super ()
		
		this._xmlReader = xmlReader
		
		this.fix = null
		
		if (xmlReader.useEntities) {
		
			const {entityResolver} = xmlReader
			
			this.fix = s => entityResolver.fix (s)
		
		}

	}
	
	set (k, v) {
	
		{
		
			const {fix} = this
		
			if (fix !== null) v = fix (v)

		}

		return super.set (k, v)
	
	}

}

module.exports = AttributesMap