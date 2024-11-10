const {AttributesMap} = require ('../')

test ('bad', () => {

	expect (() => new AttributesMap ('href=`#`')).toThrow ()
	expect (() => new AttributesMap ('href=')).toThrow ()
	expect (() => new AttributesMap ('href="#" =""')).toThrow ()
	expect (() => new AttributesMap ('href="#')).toThrow ()

})

test ('basic', () => {

	expect (Object.fromEntries (new AttributesMap (`href="#" 
		name  
			 = '1'  id="" `))).toStrictEqual ({href: '#', name: '1', id: null})

})