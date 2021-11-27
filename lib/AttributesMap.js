const AttributesMap = class extends Map {

	constructor (xmlReader) {

		super ()

		this._xmlReader = xmlReader

		this.fixText = xmlReader.fixText

	}

	set (k, v) {

		return super.set (k, this.fixText (v))

	}

}

module.exports = AttributesMap