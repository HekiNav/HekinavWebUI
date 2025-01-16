import type { LatLon } from "./LatLon"

export type Place = {
    street?: string
    housenumber?: string
    coordinates: LatLon
    layer: SearchLayer
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
export enum SearchLayer {
    address = "address",
    venue = "venue",
    street = "street",
    stop = "stop",
    station = "station",
    bikestation = "bikestation",
    neighbourhood = "neighbourhood",
    localadmin = "localadmin",
    region = "region"
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