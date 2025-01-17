import type { Place } from "./Place"

export type TransitModeOptions = {
  rail: boolean,
  bus: boolean,
  tram: boolean,
  ferry: boolean,
  subway: boolean,
} & object
export class SearchOptions {
  time?: string
  modes: TransitModeOptions
  origin?: Place
  destination?: Place
  constructor(origin?: Place, destination?: Place, time?: string, modes?: TransitModeOptions) {
    this.modes = modes || { rail: true, bus: true, tram: true, ferry: true, subway: true }
    this.origin = origin
    this.destination = destination
    this.time = time
  }
  toggleMode(mode: keyof TransitModeOptions) {
    this.modes[mode] = !this.modes[mode]
  }
  modesToString() {
    const string = JSON.stringify(Object.keys(this.modes).map((mode, i) => ({ "mode": mode.toUpperCase(), "used": Object.values(this.modes)[i] })).filter(mode => mode.used).map(mode => ({ "mode": mode.mode }))).replace(/"/g, '')
    return string
  }
  toGraphQL() {
    return `
{
  planConnection(
    origin: {location: {coordinate: {latitude: ${this.origin?.coordinates.lat}, longitude: ${this.origin?.coordinates.lon}}}}
    destination: {location: {coordinate: {latitude: ${this.destination?.coordinates.lat}, longitude: ${this.destination?.coordinates.lon}}}}
    first: 2
    dateTime: {earliestDeparture: "${this.time}"}
    modes: {transit: {transit: ${this.modesToString()}}}
  ) {
    pageInfo {
      endCursor
    }
    edges {
      node {
        start
        end
        legs {
          duration
          mode
          distance
          start {
            scheduledTime
          }
          end {
            scheduledTime
          }
          mode
          duration
          realtimeState
        }
      }
    }
  }
}`
  }
}
