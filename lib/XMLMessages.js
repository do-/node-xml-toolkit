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

	['XVS-00001', `The value "%s" doesn't match the pattern %s`],
	['XVS-00002', `The value "%s" doesn't match any of the patterns: %s`],
	['XVS-00003', `The value '%s' is not in list: %s`],
	['XVS-00004', `The value '%s' has the length %i, which exceeds the allowed maximum of %i`],
	['XVS-00005', `The value '%s' has the length %i, which is less than the allowed minimum of %i`],
	['XVS-00006', `The value '%s' has the length %i, must be exaclty %i`],
	['XVS-00007', `The value '%s' is less than the least allowed '%s'`],
	['XVS-00008', `The value '%s' is greater than the greatest allowed '%s'`],
	['XVS-00009', `The value '%s' is less or equal than the threshold '%s'`],
	['XVS-00010', `The value '%s' is greater or equal than the threshold '%s'`],
	['XVS-00011', `No boolean value can be empty`],
	['XVS-00012', `'%s' is not a boolean value`],

])

class XMLMessages {

	static VOCABULARY = VOCABULARY

	static format (args) {

		args [0] = VOCABULARY.get (args [0])

		return util.format.apply (util, args)

	}
	
}

module.exports = XMLMessages