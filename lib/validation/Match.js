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

        return [...new Set ([...this.expected (node ['_ns_map'])])].sort ().join ('; ')

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