const MIN_LENGTH = 10
const CH_PERIOD = '.'.charCodeAt (0)
const CH_COLON  = ':'.charCodeAt (0)
const CH_MINUS  = '-'.charCodeAt (0)
const CH_PLUS   = '+'.charCodeAt (0)
const CH_T      = 'T'.charCodeAt (0)
const CH_0      = '0'.charCodeAt (0)
const CH_9      = '9'.charCodeAt (0)

const tzCache = new Set (['Z', '+14:00', '-14:00'])

const die = payload => {

	const err = Error ('DT7 error')

	err.payload = payload

	throw err

}

class DT7 {
	
	constructor (src) {

		const t = typeof src; if (t !== 'string') throw Error (`The Seven-property Date Time Model can only be constructed from a string, not a(n) ${t}`)

		const {length} = src; if (length < MIN_LENGTH) die (['XVS-00005', src, length, MIN_LENGTH])

		this.src = src

		this.parse ()
		this.validate ()

	}

	parse () {

		this.posMonth = this.src.indexOf ('-', 1)

		if (this.posMonth === -1) die (['XVS-00025', this.src])

		if (this.posMonth < 3) die (['XVS-00026', this.src, this.year])

		if (this.src.charCodeAt (this.posDay) !== CH_MINUS) throw Error (`The character at ${this.posDay} must be '-', not '${this.src.charAt (this.posDay)}'`)
		
		const {length} = this.src

		if (length < this.endOfDate) throw Error (`The day part must be 2 chars long, found '${this.day}'`)

		if (length !== (this.endOfDateTime = this.endOfDate)) this.parseAfterDate ()

	}

	parseAfterDate () {
		
		if (this.src.charCodeAt (this.endOfDate) !== CH_T) return

		for (const pos of [this.endOfHour, this.endOfMinute])

			if (this.src.charCodeAt (pos) !== CH_COLON)
				
				throw Error (`Invalid time part: the character at position ${pos} must be ':', not '${this.src.charAt (pos)}'`)

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

		if (year.charCodeAt (base) === CH_0 && length - base !== 4) throw Error (`Starting with 0, the year must have exactly 4 digits`)
		
		for (let i = base; i < length; i ++) {

			const c = year.charCodeAt (i)

			if (c > CH_9 || c < CH_0) throw Error (`Invalid year: '${year.charAt (i)} at position ${i}'`)

		}

	}

	validateMonth () {

		const {month} = this

		if (month < '01' || month > '12') throw Error (`Invalid month`)

	}

	validateDay () {

		const {day} = this

		if (day < '01' || day > '31') throw Error (`Invalid day`)

		if (day === '31' || (this.month === '02' && day > '28')) {

			if (new Date (this.src.substring (0, this.endOfDate)).getDate () != day) throw Error (`Non existing day`)

		}

	}

	validateTime () {

		const {hour, minute, second} = this

		if (hour      < '00'    || hour      > '23') throw Error (`Invalid hour`)
		if (minute    < '00'    || minute    > '59') throw Error (`Invalid minute`)

		const intSecond = second.length === 2 ? second : second.substring (0, 2)

		if (intSecond < '00'    || intSecond > '59') throw Error (`Invalid second`)

	}

	validateTZ () {

		const {tz} = this; if (tz === undefined || tzCache.has (tz)) return

		switch (tz.charCodeAt (0)) {
			case CH_PLUS:
			case CH_MINUS:
				break
			default:
				throw Error (`Unless 'Z', the timezone must start with either '+' or '-', not ${tz.charAt (0)}`)
		}

		if (tz.length !== 6) throw Error (`Invalid timezone length: ${tz.length}`)

		if (tz.charCodeAt (3) !== CH_COLON) throw Error (`Invalid timezone: ':' not found at position 3`)

		{

			const hh = tz.substring (1, 3); if (hh < '00' || hh > '13') throw Error (`Invalid TZ hour: ${hh}`)

		}

		{

			const mm = tz.substring (4, 6); if (mm < '00' || mm > '59') throw Error (`Invalid TZ minute: ${mm}`)

		}

		tzCache.add (tz)

	}

}

module.exports = DT7