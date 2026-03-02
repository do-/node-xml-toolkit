const DT7 = require ('../lib/simple/DT7')

test ('bad', () => {

	expect (() => new DT7 (0)).toThrow ('from a string')
	expect (() => new DT7 ('')).toThrow ('10 required')
	expect (() => new DT7 ('************')).toThrow ('year separator')
	expect (() => new DT7 ('-----------')).toThrow ('not a valid year')
	expect (() => new DT7 ('1970-----------')).toThrow ('Invalid month')
	expect (() => new DT7 ('1970-05----------')).toThrow ('Invalid day')
	expect (() => new DT7 ('1970-05-15---------')).toThrow ('Invalid timezone length: 9')
	expect (() => new DT7 ('1970-05-15Y')).toThrow ('timezone must start')
	expect (() => new DT7 ('1970-05-15+')).toThrow ('Invalid timezone length')
	expect (() => new DT7 ('1970-05-15+00000')).toThrow ("':' not found")
	expect (() => new DT7 ('1970-05-15T+00:00')).toThrow ("Invalid time part")

})

test ('basic dt tz', () => {

	const dt = new DT7 ('2026-02-27T12:35:24.123+03:00')

	expect (dt.year).toBe ('2026')
	expect (dt.month).toBe ('02')
	expect (dt.day).toBe ('27')
	expect (dt.hour).toBe ('12')
	expect (dt.minute).toBe ('35')
	expect (dt.second).toBe ('24.123')
	expect (dt.tz).toBe ('+03:00')

})

test ('basic dt', () => {

	const dt = new DT7 ('2026-02-27T12:35:24.123')

	expect (dt.year).toBe ('2026')
	expect (dt.month).toBe ('02')
	expect (dt.day).toBe ('27')
	expect (dt.hour).toBe ('12')
	expect (dt.minute).toBe ('35')
	expect (dt.second).toBe ('24.123')
	expect (dt.tz).toBeUndefined ()

})

test ('basic d tz', () => {

	const dt = new DT7 ('2026-02-27+03:00')

	expect (dt.year).toBe ('2026')
	expect (dt.month).toBe ('02')
	expect (dt.day).toBe ('27')
	expect (dt.hour).toBeUndefined ()
	expect (dt.minute).toBeUndefined ()
	expect (dt.second).toBeUndefined ()
	expect (dt.tz).toBe ('+03:00')

})

test ('basic d tz', () => {

	const dt = new DT7 ('2026-02-27')

	expect (dt.year).toBe ('2026')
	expect (dt.month).toBe ('02')
	expect (dt.day).toBe ('27')
	expect (dt.hour).toBeUndefined ()
	expect (dt.minute).toBeUndefined ()
	expect (dt.second).toBeUndefined ()
	expect (dt.tz).toBeUndefined ()

})
