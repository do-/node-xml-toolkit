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

        if (all.size === 1) for (const first of all) return first

        return `(${[...all].sort ().join (' | ')})`

    }

    // toString () {

    //     const {occurable: {minOccurs, maxOccurs}, occured} = this

    //     return `[${minOccurs} .. ${maxOccurs}]: ${occured}`

    // }

    getElementDefinition (node) {

        return this.isMaxedOut ? null : this.getNextElementDefinition (node)

    }

}

module.exports = Match