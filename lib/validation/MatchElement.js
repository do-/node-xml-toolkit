const Match = require ('./Match')

class MatchElement extends Match {

    getElementDefinition ({namespaceURI, localName}) {

        if (this.isMaxedOut) return null

        const {node: {attributes: {name}, targetNamespace}} = this.occurable

        if (localName !== name || namespaceURI != targetNamespace) return null

        this.occured ++

        return this.occurable.node

    }

    get clarkNotation () {

        const {occurable: {node: {attributes: {name}, targetNamespace}}} = this

        return `{${targetNamespace}}${name}`

    }

    * expected () {

        if (!this.isMaxedOut) yield this.clarkNotation

    }

    toString () {

        return this.clarkNotation + ' ' + super.toString ()

    }

}

module.exports = MatchElement