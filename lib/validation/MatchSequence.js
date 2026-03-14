const Match = require ('./Match')

class MatchSequence extends Match {

    constructor (occurable) {

        super (occurable)

        this.index = 0

    }

    getElementDefinition (node) {

        const {children} = this, {length} = children; if (length === 0) return null
        
        while (!this.isMaxedOut) {

            const child = children [this.index], el = child.getElementDefinition (node)

            if (el !== null) return el

            if (!child.isSatisfied) return null

            if ((++ this.index) < length) continue

            this.index = 0

            this.occured ++

        }

        return null

    }

    get isSatisfied () {

        const {children} = this, {length} = children; if (length === 0) return true

        for (let i = this.index + 1; i < length; i ++) {
            
            if (children [i].isSatisfied) continue

// console.log (children [i])
            
            return false

        }

        return (this.occured + 1) >= this.occurable.minOccurs

    }

    * expected (nsMap) {

        const {children} = this, {length} = children; if (length === 0) return

        for (const n of children [this.index].expected (nsMap)) yield n

        if (!children [this.index].isSatisfied) return

        for (let i = this.index + 1; i < length; i ++) {

            const child = children [i]

            for (const n of child.expected (nsMap)) yield n

            if (child.minOccurs > 0) break

        }

    }

    toString () {

        return `<${this.children.join ('; ')}>@${this.index} ${super.toString ()}`

    }


}

module.exports = MatchSequence