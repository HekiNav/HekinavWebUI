/* eslint-disable @typescript-eslint/no-wrapper-object-types */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { Place } from "@/types/Place"

export async function autocomplete(query: string) {
    const response = await fetch(`https://api.digitransit.fi/geocoding/v1/search?size=20&text=${query}&digitransit-subscription-key=06421a1eb31d4cc9a4781a585bb306c2`)
    const data = await response.json().then(results => {
        return results.features
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newData: Array<Place> = data.map((r: Object<Object<any>>) => ({
        name: r.properties.name,
        layer: r.properties.layer,
        street: r.properties.street,
        housenumber: r.properties.housenumber,
        neighbourhood: r.properties.neighbourhood,
        locality: r.properties.locality,
        localadmin: r.properties.localadmin,
        region: r.properties.region,
        postalcode: r.properties.postalcode,
        coordinates: {
            lat: r.geometry.coordinates[1],
            lon: r.geometry.coordinates[0],
        },
        transitModes: r.properties.addendum ? r.properties.addendum.GTFS.modes : null,
        code: r.properties.addendum ? r.properties.addendum.GTFS.code : null,
        platform: r.properties.addendum ? r.properties.addendum.GTFS.platform : null,

    }))
    return newData
}
export async function getItieneraries(query: string) {
    const response = await fetch(`https://api.digitransit.fi/routing/v2/hsl/gtfs/v1?digitransit-subscription-key=06421a1eb31d4cc9a4781a585bb306c2`, {
        method: "POST",
        body: query,
        headers: {
            "Content-Type": "application/graphql;"
        }
    })
    const data = await response.json().then(results => {
        return results
    })
    return data
}