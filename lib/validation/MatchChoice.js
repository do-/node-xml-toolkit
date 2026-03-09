const Match = require ('./Match')

class MatchChoice extends Match {

    constructor (occurable) {

        super (occurable)

    }

    test ({namespaceURI, localName}) {

        if (this.isMaxedOut) return false

        return true

    }

}

module.exports = MatchChoice