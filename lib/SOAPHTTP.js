const zlib = require ('zlib')

const VER = {

	'1.1': {
		contentType  : 'text/xml',
		namespaceURI : 'http://schemas.xmlsoap.org/soap/envelope/',
	},

	'1.2': {
		contentType  : 'application/soap+xml',
		namespaceURI : 'http://www.w3.org/2003/05/soap-envelope',
	},

}

const SOAPHTTP = class {

	constructor (versionNumber) {

		if (!(versionNumber in VER)) throw new Exception ('Unknown SOAP version: ' + version)

		const {contentType, namespaceURI} = VER [versionNumber]

		this.charset = 'utf-8'

		this.http = {
			method  : 'POST',
			headers : {"Content-Type": contentType},
		}

		this.soap = {
			Envelope: {attributes: `xmlns:soap="${namespaceURI}"`},
			Header:   {attributes: '', content: ''},
			Body:     {attributes: '', content: ''},
		}

	}

	el (name) {

		const {attributes, content} = this.soap [name]
	
		const qName = 'soap:' + name

		let s = '<' + qName

		if (attributes) s += ' ' + attributes

		if (!content) return s + '/>'

		return s + '>' + content + '</' + qName + '>'

	}

	build () {

		this.http.headers ['Content-Type'] += '; charset=' + this.charset

		this.soap.Envelope.content = this.el ('Header') + this.el ('Body')
		
		this.http.body = '<?xml version="1.0" encoding="' + this.charset + '"?>' + this.el ('Envelope')

		return this

	}
	
	gzip (options = {}) {

		if (!('level' in options)) options.level = 9

		this.http.body = zlib.gzipSync (this.http.body, options)
		
		this.http.headers ['Content-Encoding'] = 'gzip'

		this.http.headers ['Content-Length'] = this.http.body.length

		return this

	}

}

module.exports = SOAPHTTP