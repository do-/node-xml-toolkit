const Match = require ('./Match')

class MatchElement extends Match {

    test ({namespaceURI, localName}) {

        if (this.isMaxedOut) return false

        const {node: {attributes: {name}, targetNamespace}} = this.occurable

        if (localName !== name || namespaceURI != targetNamespace) return false

        this.occured ++

        return true

    }

}

module.exports = MatchElement