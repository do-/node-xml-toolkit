const MIN_LENGTH = 10
const CH_PERIOD = '.'.charCodeAt (0)
const CH_COLON  = ':'.charCodeAt (0)
const CH_MINUS  = '-'.charCodeAt (0)
const CH_PLUS   = '+'.charCodeAt (0)
const CH_T      = 'T'.charCodeAt (0)
const CH_0      = '0'.charCodeAt (0)
const CH_9      = '9'.charCodeAt (0)

const tzCache = new Set (['Z', '+14:00', '-14:00'])

class DT7 {
	
	constructor (src) {

		const t = typeof src; if (t !== 'string') throw Error (`The Seven-property Date Time Model can only be constructed from a string, not a(n) ${t}`)

		this.src = src

		const {length} = src; if (length < MIN_LENGTH) this.raise ('XVS-00005', length, MIN_LENGTH)

		this.parse ()
		this.validate ()

	}

	raise (code, ...args) {

		const err = Error ('DT7 error')

		err.payload = [code, this.src, ...args]

		throw err

	}

	parse () {

		this.posMonth = this.src.indexOf ('-', 1)

		if (this.posMonth === -1) this.raise ('XVS-00025')

		if (this.posMonth < 3) this.raise ('XVS-00026', this.year)

		if (this.src.charCodeAt (this.posDay) !== CH_MINUS) this.raise ('XVS-00027', this.posDay, this.src.charAt (this.posDay))
		
		const {length} = this.src

		if (length < this.endOfDate) this.raise ('XVS-00028', this.day)

		if (length !== (this.endOfDateTime = this.endOfDate)) this.parseAfterDate ()

	}

	parseAfterDate () {
		
		if (this.src.charCodeAt (this.endOfDate) !== CH_T) return

		for (const pos of [this.endOfHour, this.endOfMinute]) if (this.src.charCodeAt (pos) !== CH_COLON) this.raise ('XVS-00029', pos, this.src.charAt (pos))
				
		this.hasTime = true

		this.parseAfterMinute ()	

	}

	parseAfterMinute () {

		this.endOfDateTime = this.endOfMinute + 3; if (this.src.charCodeAt (this.endOfDateTime) !== CH_PERIOD) return

		const {length} = this.src; while (true) {

			this.endOfDateTime ++; if (this.endOfDateTime === length) break

			const c = this.src.charCodeAt (this.endOfDateTime); if (c >= CH_0 && c <= CH_9) continue

			break

		}

	}

	get posDay () {

		return this.posMonth + 3

	}

	get endOfDate () {

		return this.posMonth + 6

	}
	
	get endOfHour () {

		return this.posMonth + 9

	}

	get endOfMinute () {

		return this.posMonth + 12

	}

	get year () {

		return this.src.substring (0, this.posMonth)

	}

	get month () {

		return this.src.substring (this.posMonth + 1, this.posDay)

	}

	get day () {

		return this.src.substring (this.posDay + 1, this.posDay + 3)

	}

	get hour () {

		if (this.hasTime) return this.src.substring (this.endOfDate + 1, this.endOfHour)

	}

	get minute () {

		if (this.hasTime) return this.src.substring (this.endOfHour + 1, this.endOfMinute)

	}

	get second () {

		if (this.hasTime) return this.src.substring (this.endOfMinute + 1, this.endOfDateTime)

	}

	get tz () {

		const s = this.src.substring (this.endOfDateTime)

		return s.length === 0 ? undefined : s

	}

	validate () {

		this.validateDate ()

		if (this.hasTime) this.validateTime ()

		this.validateTZ ()

	}
	
	validateDate () {

		this.validateMonth ()
		this.validateYear  ()
		this.validateDay   ()

	}

	validateYear () {

		const {year} = this, {length} = year, base = year.charCodeAt (0) === CH_MINUS ? 1 : 0

		if (year.charCodeAt (base) === CH_0 && length - base !== 4) this.raise ('XVS-00026', year)
		
		for (let i = base; i < length; i ++) {

			const c = year.charCodeAt (i)

			if (c > CH_9 || c < CH_0) this.raise ('XVS-00030', year, year.charAt (i), i)

		}

	}

	validateMonth () {

		const {month} = this

		if (month < '01' || month > '12') this.raise ('XVS-00031', month)

	}

	validate2digits (value, code, max = '59', min = '00') {

		if (value < min || value > max) this.raise (code, value)

	}

	validateDay () {

		const {day} = this

		this.validate2digits (day, 'XVS-00032', '31', '01')

		if (day === '31' || (this.month === '02' && day > '28')) {

			if (new Date (this.src.substring (0, this.endOfDate)).getDate () != day) this.raise ('XVS-00033')

		}

	}

	validateTime () {

		this.validate2digits (this.hour,   'XVS-00034', '23')
		this.validate2digits (this.minute, 'XVS-00035')

		const {second} = this, intSecond = second.length === 2 ? second : second.substring (0, 2)

		this.validate2digits (intSecond,   'XVS-00036')

	}

	validateTZ () {

		const {tz} = this; if (tz === undefined || tzCache.has (tz)) return

		switch (tz.charCodeAt (0)) {
			case CH_PLUS:
			case CH_MINUS:
				break
			default:
				this.raise ('XVS-00039', tz.charAt (0))
		}

		if (tz.length !== 6) this.raise ('XVS-00040', tz.length)

		if (tz.charCodeAt (3) !== CH_COLON) this.raise ('XVS-00041')

		this.validate2digits (tz.substring (1, 3), 'XVS-00037', '13')
		this.validate2digits (tz.substring (4, 6), 'XVS-00038')

		tzCache.add (tz)

	}

}

module.exports = DT7