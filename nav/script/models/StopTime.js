export default class StopTime {
    constructor(arrivalDelay,departureDelay,dropOffType,headsign,pickupType,realtime,realtimeArrival,realtimeDeparture,realtimeState,scheduledArrival,scheduledDeparture,serviceDay,stop,stopPosition,stopPositionInPattern,timepoint,trip) {
        this.arrivalDelay = arrivalDelay,
        this.departureDelay = departureDelay,
        this.dropOffType = dropOffType,
        this.headsign = headsign,
        this.pickupType = pickupType,
        this.realtime = realtime,
        this.realtimeArrival = realtimeArrival,
        this.realtimeDeparture = realtimeDeparture,
        this.realtimeState = realtimeState,
        this.scheduledArrival = scheduledArrival,
        this.scheduledDeparture = scheduledDeparture,
        this.serviceDay = serviceDay,
        this.stop = stop,
        this.stopPosition = stopPosition,
        this.stopPositionInPattern = stopPositionInPattern,
        this.timepoint = timepoint,
        this.trip = trip
    }
}