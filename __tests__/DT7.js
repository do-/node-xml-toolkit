const DT7 = require ('../lib/simple/DT7')

test ('bad', () => {

	expect (() => new DT7 (0)).toThrow ('from a string')

	try {
		new DT7 ('')
	}
	catch (err) {
		expect (err.payload [0]).toBe ('XVS-00005')
	}

})

test ('basic dt ms tz', () => {

	const dt = new DT7 ('2026-02-27T12:35:24.123+03:00')

	expect (dt.year).toBe ('2026')
	expect (dt.month).toBe ('02')
	expect (dt.day).toBe ('27')
	expect (dt.hour).toBe ('12')
	expect (dt.minute).toBe ('35')
	expect (dt.second).toBe ('24.123')
	expect (dt.tz).toBe ('+03:00')

})

test ('basic dt tz', () => {

	const dt = new DT7 ('2026-02-27T12:35:24+03:00')

	expect (dt.year).toBe ('2026')
	expect (dt.month).toBe ('02')
	expect (dt.day).toBe ('27')
	expect (dt.hour).toBe ('12')
	expect (dt.minute).toBe ('35')
	expect (dt.second).toBe ('24')
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

	const dt = new DT7 ('2026-03-31')

	expect (dt.year).toBe ('2026')
	expect (dt.month).toBe ('03')
	expect (dt.day).toBe ('31')
	expect (dt.hour).toBeUndefined ()
	expect (dt.minute).toBeUndefined ()
	expect (dt.second).toBeUndefined ()
	expect (dt.tz).toBeUndefined ()

})

test ('negative year', () => {

	const dt = new DT7 ('-2026-02-27')

	expect (dt.year).toBe ('-2026')
	expect (dt.month).toBe ('02')
	expect (dt.day).toBe ('27')
	expect (dt.hour).toBeUndefined ()
	expect (dt.minute).toBeUndefined ()
	expect (dt.second).toBeUndefined ()
	expect (dt.tz).toBeUndefined ()

})
