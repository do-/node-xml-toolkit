const util = require ('node:util')

const VOCABULARY = new Map ([

	['XML-00001', 'maxLength=%i exceeded'],

	['XML-00002', 'Unbalanced end element'],
	['XML-00003', 'Unmatched end element, </${%s}> expected'],

])

class XMLMessages {

	static VOCABULARY = VOCABULARY

	static format (code, args = []) {

		return util.format.apply (util, [VOCABULARY.get (code), ...args])

	}
	
}

module.exports = XMLMessages