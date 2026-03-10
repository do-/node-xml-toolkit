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

}

module.exports = Match