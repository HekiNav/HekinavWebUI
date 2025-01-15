export async function autocomplete(query: string) {
    const response = await fetch(`https://api.digitransit.fi/geocoding/v1/search?size=20&text=${query}&digitransit-subscription-key=06421a1eb31d4cc9a4781a585bb306c2`)
    const data = await response.json()
    return data
}