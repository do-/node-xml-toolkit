const Match = require ('./Match')

class All extends Match {

    constructor (occurable) {

        super (occurable)

    }

    getElementDefinition (node) {

        if (this.isMaxedOut) return null

        for (const child of this.children) if (child.occured === 0) {

            const el = child.getElementDefinition (node); if (el === null) continue

            this.occured = 1; for (const child of this.children) if (child.occured === 0) this.occured = 0
                
            return el

        }

        return null

    }

}

module.exports = All