export default class Stop{
    constructor(cluster,code,gtfsId,locationType,lat,lon,parentStation,name,platformCode,stops,vehicleMode,vehicleType) {
        this.cluster = cluster
        this.code = code
        this.gtfsId = gtfsId
        this.locationType = locationType
        this.lat = lat
        this.lon = lon
        this.parentStation = parentStation
        this.name = name
        this.platformCode = platformCode
        this.stops = stops
        this.vehicleMode = vehicleMode
        this.vehicleType = vehicleType
    }
}