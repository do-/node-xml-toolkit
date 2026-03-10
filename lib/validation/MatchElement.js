const Match = require ('./Match')

class MatchElement extends Match {

    getElementDefinition ({namespaceURI, localName}) {

        if (this.isMaxedOut) return null

        const {node: {attributes: {name}, targetNamespace}} = this.occurable

        if (localName !== name || namespaceURI != targetNamespace) return null

        this.occured ++

        return this.occurable.node

    }

}

module.exports = MatchElement