const Match = require ('./Match')

class MatchSequence extends Match {

    constructor (occurable) {

        super (occurable)

        this.index = 0

    }

    test ({namespaceURI, localName}) {

        if (this.isMaxedOut) return false

        return true

    }

}

module.exports = MatchSequence