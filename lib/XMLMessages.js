const util = require ('node:util')

const VOCABULARY = new Map ([

	['XML-00001', 'maxLength=%i exceeded'],

	['XML-00002', 'Unbalanced end element'],
	['XML-00003', 'Unmatched end element, </${%s}> expected'],

	['XVC-00001', 'No nested elements allowed inside %s'],
	['XVC-00002', 'is unexpected here; should be %s'],
	['XVC-00003', 'Unknown attribute: %s'],
	['XVC-00004', 'The attribute "%s" must have the value "%s", not "%s"'],
	['XVC-00005', 'Missing required attribute: "%s"'],

])

class XMLMessages {

	static VOCABULARY = VOCABULARY

	static format (args) {

		args [0] = VOCABULARY.get (args [0])

		return util.format.apply (util, args)

	}
	
}

module.exports = XMLMessages