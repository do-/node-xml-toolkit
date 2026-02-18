const {XMLStreamPrinter}   = require ('..')
const {Readable, Writable} = require ('node:stream')

test ('constructor', () => {

	expect (() => new XMLStreamPrinter ()).toThrow ()
	expect (() => new XMLStreamPrinter ('A')).toThrow ()
	expect (() => new XMLStreamPrinter ({})).toThrow ()
	expect (() => new XMLStreamPrinter ({out: 'A'})).toThrow ()

})

test ('inStream', async () => {

    const printer = new XMLStreamPrinter ({ out: new Writable () })

    expect (printer.inStream).toBeUndefined ()

    const readable = Readable.from ([{id: 1}])

    await new Promise ((ok, fail) => {

        printer.forEach (readable, data => {

            expect (printer.inStream).toBe (readable)

        }).then (ok, fail)

    })

})

test ('inStream error', async () => {

    const out = new Writable ({
        write (chunk, encoding, callback) {
            callback ()
        },        
    }), e = []

    const outClosed = new Promise (ok => out.on ('close', ok))

    out.on ('error', err => {e.push (err)})

    const printer = new XMLStreamPrinter ({out})

    expect (printer.inStream).toBeUndefined ()

    const readable = Readable.from ([{id: 1}])

    const E = Error ('OK')

    expect (new Promise ((ok, fail) => {

        printer.forEach (readable, data => {

            readable.destroy (E)

        }).then (ok, fail)

    })).rejects.toBe (E)

    await outClosed

    expect (e).toEqual ([E])

})

test ('inStream error', async () => {

    const out = new Writable ({
        write (chunk, encoding, callback) {
            callback ()
        },        
    })

    const printer = new XMLStreamPrinter ({out})

    const readable = Readable.from ([{id: 1}])

    expect (new Promise ((ok, fail) => {

        out.on ('error', fail)

        printer.forEach (readable, data => {

            printer.forEach (Readable.from ([]), _ => _)

        })

    })).rejects.toBeDefined ()

})

test ('forEach handler error', async () => {

    const out = new Writable ({
        write (chunk, encoding, callback) {
            callback ()
        },        
    }), e = []

    const outClosed = new Promise (ok => out.on ('close', ok))

    out.on ('error', err => {e.push (err)})

    const printer = new XMLStreamPrinter ({out})

    expect (printer.inStream).toBeUndefined ()

    const readable = Readable.from ([{id: 1}])

    const E = Error ('OK')

    expect (new Promise ((ok, fail) => {

        printer.forEach (readable, data => {

            throw E

        }).then (ok, fail)

    })).rejects.toBe (E)

    await outClosed

    expect (e).toEqual ([E])

})

test ('pause/resume', async () => {

    let s = ''

    const out = new Writable ({highWaterMark: 1,
        write (chunk, encoding, callback) {
            s += chunk.toString ()
            setTimeout (callback, 10)
        },        
    })
    
    const printer = new XMLStreamPrinter ({out})
    printer.write ('0')

    const readable = Readable.from (['', '1', '2'])

    const main = new Promise ((ok, fail) => {

        printer.forEach (readable, data => {

            printer.write (data)
            
        }).then (ok, fail)

    })

    await main

    expect (s).toBe ('012')

})