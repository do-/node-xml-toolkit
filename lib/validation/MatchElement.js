const Match = require ('./Match')

class MatchElement extends Match {

    getNextElementDefinition ({namespaceURI, localName}) {

        const {node: {attributes: {name}, targetNamespace}} = this.occurable

        if (localName !== name || namespaceURI != targetNamespace) return null

        this.occured ++

        return this.occurable.node

    }

    get clarkNotation () {

        const {occurable: {node: {attributes: {name}, targetNamespace}}} = this

        return `{${targetNamespace}}${name}`

    }

    * expected (nsMap) {

        if (this.isMaxedOut) return

        const {occurable: {node: {attributes: {name}, targetNamespace}}} = this

        for (const qName of nsMap.getQNames (name, targetNamespace)) {

            yield `<${qName}>`

            return

        }

    }

    toString () {

        return this.clarkNotation + ' ' + super.toString ()

    }

}

module.exports = MatchElement