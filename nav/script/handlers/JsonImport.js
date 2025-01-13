export default async function JsonImport(jsonFileName, fn) {
    const data = await fetch('./data/' + jsonFileName)
    fn(await data.json())
}