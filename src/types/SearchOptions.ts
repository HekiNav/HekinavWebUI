import type { Place } from "./Place"

type TransitModeOptions = {
    train: boolean,
    bus: boolean,
    tram: boolean,
    ferry: boolean,
    subway: boolean,
}
export class SearchOptions {
    modes: TransitModeOptions
    origin: Place
    destination: Place
    constructor(origin: Place, destination: Place,) {
        this.modes = { train: true, bus: true, tram: true, ferry: true, subway: true }
        this.origin = origin
        this.destination = destination
    }
}
