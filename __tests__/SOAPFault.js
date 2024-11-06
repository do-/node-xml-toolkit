const {SOAPFault} = require ('../')

test ('basic', () => {

	expect (new SOAPFault ({message: 'Hi'}).message).toBe ('Hi')

	expect (new SOAPFault ({message: 'Hi', actor: 'guest'}).actor).toBe ('guest')
	expect (new SOAPFault ({message: 'Hi', role: 'admin'}).actor).toBe ('admin')
	
	expect (new SOAPFault ({message: 'Hi', code: 'red'}).code).toBe ('red')

})