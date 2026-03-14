const Match = require ('./Match')

class All extends Match {

    getNextElementDefinition (node) {

        for (const child of this.children) if (child.occured === 0) {

            const el = child.getElementDefinition (node); if (el === null) continue

            this.occured = 1; for (const child of this.children) if (child.occured === 0) this.occured = 0
                
            return el

        }

        return null

    }

    * expected () {

        for (const child of this.children)
            
            if (!child.isSatisfied) 

                for (const n of child.expected ()) yield n

    }

}

module.exports = All