const Match = require ('./Match')

class Any extends Match {

    getNextElementDefinition () {

        this.occured ++

        return this.occurable.node

    }

}

module.exports = Any