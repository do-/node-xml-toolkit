const Match = require ('./Match')

class MatchChoice extends Match {

    getNextElementDefinition (node) {

        for (const child of this.children) {

            const el = child.getElementDefinition (node); if (el === null) continue

            this.occured ++
                
            return el

        }

        return null

    }

    * expected (nsMap) {

        for (const child of this.children)
            
            if (!child.isSatisfied) 

                for (const n of child.expected ()) yield n

    }

}

module.exports = MatchChoice