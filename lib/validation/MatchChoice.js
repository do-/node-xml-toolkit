const Match = require ('./Match')

class MatchChoice extends Match {

    #filteredChildren = null

    constructor (occurable) {

        super (occurable)

    }

    get filteredChildren () {

        if (this.#filteredChildren === null) this.#filteredChildren = this.children

        return this.#filteredChildren

    }

    getNextElementDefinition (node) {
        
        for (const child of this.filteredChildren) {

            const el = child.getElementDefinition (node); if (el === null) continue

            if (child.isSatisfied) {

                this.occured ++

                for (const child of (this.#filteredChildren = this.children)) child.occured = 0

            }
            else {

                this.#filteredChildren = [child]

            }

            return el

        }

        return null

    }

    get isSatisfied () {

        const {occured, occurable: {minOccurs}} = this

        if (occured >= minOccurs) return true

        if (occured < minOccurs - 1) return false

        for (const child of (this.filteredChildren)) if (child.isSatisfied) return true

        return false
        
    }

    * expected (nsMap) {

        for (const child of this.children)
            
            if (!child.isSatisfied) 

                for (const n of child.expected ()) yield n

    }

}

module.exports = MatchChoice