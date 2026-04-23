class Match {

    constructor (occurable) {

        this.occurable = occurable
        this.occured   = 0

    }

    get isSatisfied () {

        return this.occured >= this.occurable.minOccurs

    }
 
    get isMaxedOut () {

        return this.occured >= this.occurable.maxOccurs

    }

    allExpected (node) {

        const all = new Set ([...this.expected (node ['_ns_map'])])

        switch (all.size) {

            case 0: return null

            case 1: for (const first of all) return first

            default: return `(${[...all].sort ().join (' | ')})`

        }

    }

    // toString () {

    //     const {occurable: {minOccurs, maxOccurs}, occured} = this

    //     return `[${minOccurs} .. ${maxOccurs}]: ${occured}`

    // }

    getElementDefinition (node) {

        if (this.occurable.maxOccurs > 1) node [Symbol.for ('_multiple')] = true

        return this.isMaxedOut ? null : this.getNextElementDefinition (node)

    }

}

module.exports = Match