const Match = require ('./Match')

class MatchElement extends Match {

    getNextElementDefinition ({namespaceURI, localName}) {

        const {node: {attributes: {name}, targetNamespace}} = this.occurable

        if (localName === name && namespaceURI == targetNamespace) {

            this.occured ++

            return this.occurable.node

        }

        const el = this.occurable.xs?.getSchema (namespaceURI)?.get (localName)
        const sg = el?.attributes?.substitutionGroup

        if (!sg || sg [0] !== name || sg [1] !== targetNamespace) return null

        this.occured ++

        return el

    }

    get clarkNotation () {

        const {occurable: {node: {attributes: {name}, targetNamespace}}} = this

        return `{${targetNamespace}}${name}`

    }

    * expected (nsMap) {

        if (this.isMaxedOut) return

        const {occurable: {node: {attributes: {name}, targetNamespace}}} = this

        if (!nsMap) return yield this.clarkNotation

        for (const qName of nsMap.getQNames (name, targetNamespace)) return yield `<${qName}>`

    }

    // toString () {

    //     return this.clarkNotation + ' ' + super.toString ()

    // }

}

module.exports = MatchElement