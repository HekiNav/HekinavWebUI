import type { LatLon } from "./LatLon"

export type Place = {
    coordinates: LatLon
    layer: AutocompleteLayer
    name: string,
    postalCode: string,
    region: string,
    localAdmin: string,
    locality: string,
    neighbourhood: string,
    transitModes?: [TransitMode],
    platform?: number,
    code?: string,
}
enum AutocompleteLayer {
    address, venue, street, stop, station, bikestation, neighbourhood, localadmin, region
}
enum TransitMode {
    SPEEDTRAM,
    TRAM,
    RAIL,
    BUS,
    "BUS-LOCAL",
    "BUS-EXPRESS",
    AIRPLANE
}