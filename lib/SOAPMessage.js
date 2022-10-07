const SOAPMessage = class {

	constructor (version) {
	
		if (version === '1.1') {
			this.namespaceURI = 'http://schemas.xmlsoap.org/soap/envelope/'
		}
		else if (version === '1.2') {
			this.namespaceURI = 'http://www.w3.org/2003/05/soap-envelope'
		}
		else {
			throw new Exception ('Unknown SOAP version: ' + version)
		}
		
		this.http = {headers: {}}
		
		this.soap = {
			Envelope: {attributes: `xmlns:soap="${this.namespaceURI}"`},
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
	
	toString () {
	
		this.soap.Envelope.content = this.el ('Header') + this.el ('Body')
		
		return this.el ('Envelope')
		
	}

}

module.exports = SOAPMessage