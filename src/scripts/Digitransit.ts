import type { Place } from "@/types/Place"

export async function autocomplete(query: string) {
    const response = await fetch(`https://api.digitransit.fi/geocoding/v1/search?size=20&text=${query}&digitransit-subscription-key=06421a1eb31d4cc9a4781a585bb306c2`)
    const data = await response.json().then(results => {
        return results.features
    })
    // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types, @typescript-eslint/no-explicit-any
    const newData: Array<Place> = data.map((r: Object<Object<any>>) => ({
        name: r.properties.name,
        street: r.properties.street,
        housenumber: r.properties.housenumber,
        neighbourhood: r.properties.neighbourhood,
        locality: r.properties.locality,
        localadmin: r.properties.localadmin,
        region: r.properties.region,
        postalcode: r.properties.postalcode,
        coordinates: {
            lat: r.geometry.coordinates[0],
            lon: r.geometry.coordinates[1],
        }

    }))
    return newData
}