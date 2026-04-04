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
	['XVS-00013', `No decimal value can be empty`],
	['XVS-00014', `'%s' is not a valid decimal: '%s' can occur only at the beginning`],
	['XVS-00015', `'%s' is not a valid decimal: 2nd period occured at position %i`],
	['XVS-00016', `'%s' is not a valid decimal: '%s' occured at position %i`],
	['XVS-00017', `'%s' is not a valid decimal: is has no digits at all`],
	['XVS-00018', `'%s' has %i digits, only %i allowed`],
	['XVS-00019', `'%s' has  %i digits after period, only %i allowed`],
	['XVS-00020', `No floating point number can be empty`],
	['XVS-00021', `'%s' is not a floating point number`],
	['XVS-00022', `For a date value, the time part cannot be present, but '%s' contains it`],
	['XVS-00023', `For a dateTime value, the time part is mandatory, missing from '%s'`],
	['XVS-00024', `For a dateTimeStamp value, both time and timezone parts are mandatory, missing from '%s'`],

])

class XMLMessages {

	static VOCABULARY = VOCABULARY

	static format (args) {

		args [0] = VOCABULARY.get (args [0])

		return util.format.apply (util, args)

	}
	
}

module.exports = XMLMessages