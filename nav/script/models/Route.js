export default class Route{
    constructor(agency,gtfsId,longName,mode,stops,type) {
        this.agency = agency
        this.gtfsId = gtfsId
        this.longName = longName
        this.mode = mode
        this.stops = stops
        this.type = type
    }
}