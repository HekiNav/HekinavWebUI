const canvasRenderer = L.canvas({ padding: 0.5, tolerance: 5 });
const svgRenderer = L.svg({ padding: 0.5 })

const osmTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    preferCanvas: true,
    maxZoom: 19,
})
const hslTiles = L.tileLayer('https://digitransit-prod-cdn-origin.azureedge.net/map/v2/hsl-map/{z}/{x}/{y}@2x.png?digitransit-subscription-key=bbc7a56df1674c59822889b1bc84e7ad', {
    preferCanvas: true,
    maxZoom: 19,
    tileSize: 512,
    zoomOffset: -1,
})
const satelliteTiles = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    preferCanvas: true,
    maxZoom: 19,
})
const satelliteTiles2 = L.tileLayer('https://api.tomtom.com/map/1/tile/sat/main/{z}/{x}/{y}.jpg?key=l2jEJ3QuyQdG7rBkjTb5GdWedmu2hNB8', {
    preferCanvas: true,
    maxZoom: 19,
})
const satelliteTiles3 = L.tileLayer('https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=3hocw1xzVGbXb2H0EyeX', {
    preferCanvas: true,
    maxZoom: 19,
})
const hillShadeTiles = L.tileLayer('https://api.tomtom.com/map/1/tile/hill/main/{z}/{x}/{y}.png?key=l2jEJ3QuyQdG7rBkjTb5GdWedmu2hNB8', {
    preferCanvas: true,
    maxZoom: 13,
})
const map = L.map('map', {
    minZoom: 5,
    maxZoom: 20,
    preferCanvas: true,
    layers: [
        hslTiles
    ],
}).setView([60.174706, 24.940376], 15);

const stopPane = map.createPane('stops').style.zIndex = 648;
const transferMarkerPane = map.createPane('transfermarkers').style.zIndex = 649;
const previewPane = map.createPane('preview');
previewPane.style.zIndex = 647;
const stopTiles = L.vectorGrid.protobuf("https://digitransit-prod-cdn-origin.azureedge.net/map/v2/finland-stop-map/{z}/{x}/{y}.pbf?digitransit-subscription-key=a1e437f79628464c9ea8d542db6f6e94", { pane: "stops", interactive: true })
stopTiles.addTo(map)
map.on('zoomend', (e) => {
    if (map.getZoom() >= 8 && !labelsOnMap) {
        labelsOnMap = true
        labelGroup.eachLayer(label => {
            label.addTo(map)
        })
        zones.eachLayer(zone => {
            zone.addTo(map)
        })
    }
    if (map.getZoom() < 8 && labelsOnMap) {
        labelsOnMap = false
        labelGroup.eachLayer(label => {
            label.removeFrom(map)
        })
        zones.eachLayer(zone => {
            zone.removeFrom(map)
        })
    }
})
L.control.locate({
    flyTo: true,
    setView: 'untilPan',
    keepCurrentZoomLevel: true,
    initialZoomLevel: 15,
}).addTo(map);
const baseLayers = {
    "HSL Map": hslTiles,
    "OSM": osmTiles,
    "Satellite": satelliteTiles,
    "Satellite 2": satelliteTiles2,
    "Satellite 3": satelliteTiles3,
    "Hillshade" : hillShadeTiles
}
L.control.layers(baseLayers).addTo(map)
let recentSearches = []
let maxRecentSearches = 10
recentSearches.add = function (values) {
    if (values != null) {
        if (values.length) {
            values.forEach(value => {
                if (this.includes(value)) {
                } else {
                    if (this.length >= maxRecentSearches) {
                        this.splice(0, 1)
                    }
                    this.push(value)
                }
            })
        } else {
            if (this.includes(values)) {
            } else {
                if (this.length >= maxRecentSearches) {
                    this.splice(0, 1)
                }
                this.push(values)
                saveRecentSearches(this)
            }
        }
    }
}
let gtfsrt
protobuf.load("data/gtfs-realtime.proto", function (err, root) {
    if (err) console.error(err)
    gtfsrt = root.lookupType("transit_realtime.FeedMessage");
});
let timeouts = []
let stops = []
let gen = 0
let depsRunning = false
let invalidStops = []
let stopPopup = document.getElementById('stopPopup')
let stopPopupC = document.getElementById('popupContent')
let stopImportanceOffset = 0
let values = {}
const image = {
    walk(size, color = '#000') { return `<svg fill="${color}" height="${size}px" width="${size}px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 128 128" xml:space="preserve"><path d="M67.9,22.6c5.7,0.4,10.8-3.8,11.3-9.7c0.4-5.7-3.8-10.8-9.7-11.3c-5.7-0.4-10.8,3.8-11.3,9.7C57.8,17.1,62.2,22.2,67.9,22.6"/><path d="M59,26.9c2-1.5,4.5-2.3,7.3-2.2c3.5,0.3,6.6,2.5,8.3,5.1l10.5,20.9l14.3,10c1.2,1,2,2.5,1.9,4.1c-0.1,2.6-2.5,4.5-5.1,4.2c-0.7,0-1.5-0.3-2.2-0.7L78.6,57.8c-0.4-0.4-0.9-0.9-1.2-1.5l-4-7.8l-4.7,20.8l18.6,22c0.4,0.7,0.7,1.5,0.9,2.2l5,26.5c0,0.6,0,1,0,1.5c-0.3,4-3.7,6.7-7.6,6.6c-3.2-0.3-5.6-2.6-6.4-5.6l-4.7-24.7L59.4,81l-3.5,16.1c-0.1,0.7-1.2,2.3-1.5,2.9L40,124.5c-1.5,2.2-3.8,3.7-6.6,3.4c-4-0.3-6.9-3.7-6.6-7.6c0.1-1.2,0.6-2.2,1-3.1l13.5-22.5L52.5,45l-7.3,5.9l-4,17.7c-0.4,2.2-2.6,4.1-5,4c-2.6-0.1-4.5-2.5-4.4-5.1c0-0.1,0-0.4,0.1-0.6l4.5-20.6c0.3-0.9,0.7-1.6,1.5-2.2L59,26.9z"/></svg>` },
    wait(size, color = '#000') { return `<svg fill="${color}" height="${size}px" width="${size}px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 128 128" xml:space="preserve"><circle cx="39.2" cy="17.9" r="12.6"/><path d="M78.6,70.2l-21.2,0l-5.7-28.4c-3.4-14.8-24.2-10.4-22,4.1l6.6,33c1,5,5,9.3,11.3,9.3h27.1c0,0,0,21.2,0,30c0,9.5,13.3,9.5,13.3,0.2V79.7C88,75.1,84.8,70.2,78.6,70.2z"/><path d="M64.7,90.6H46.9c-6.4,0-11.8-3.8-13.4-11l-5.8-28.2c-1.4-6.9-11.1-4.6-9.8,2.1L24,82.9c2.5,11,11.9,18.1,21.4,18.1h19.5C71.7,101,71.7,90.6,64.7,90.6z"/><path d="M91.1,3.9c-11.2,0-20.3,9.1-20.3,20.3c0,11.2,9.1,20.3,20.3,20.3c11.2,0,20.3-9.1,20.3-20.3C111.4,13.1,102.3,3.9,91.1,3.9z M91.1,40.7c-9.1,0-16.5-7.4-16.5-16.5c0-9.1,7.4-16.5,16.5-16.5c9.1,0,16.5,7.4,16.5,16.5C107.5,33.3,100.1,40.7,91.1,40.7z"/><path d="M99.5,20l-8,3.6v-9.4c0-1.5-2.2-1.4-2.2,0l0,11.3c0,0.8,0.9,1.5,1.7,1l9.4-4.5C101.7,21.3,100.9,19.3,99.5,20z"/></svg>` },
    marker(size, color = '#f55') { return `<svg width="${size}px" height="${size}px" viewBox="-4 0 36 36" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M14,0 C21.732,0 28,5.641 28,12.6 C28,23.963 14,36 14,36 C14,36 0,24.064 0,12.6 C0,5.641 6.268,0 14,0 Z" id="Shape" fill="${color}"></path><circle id="Oval" fill="#fff" fill-rule="nonzero" cx="14" cy="14" r="7"></circle></svg>` },
    vehicle(size, color = "f00", angle, text) { return `<svg height="${size}px" width="${size}px" version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="49.9" fill="${color}" style="-inkscape-stroke:none"/><path style="transform: rotate(${angle}deg); transform-origin: center center" d="m82.661 25.161-32.661-15.322-32.661 15.322" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="9.6784"/><text x="49.84375" y="63.984375" fill="#000000" font-family="'Arial'" font-size="${25 + (5 - text.length) ** 1.1 * 5}px" font-weight="500" letter-spacing=".01px" stroke-linecap="round" stroke-linejoin="round" stroke-width="15" text-align="center" text-anchor="middle" style="line-height:0;text-decoration-color:#000000" xml:space="preserve"><tspan x="49.848751" y="63.984375">${text}</tspan></text></svg>` }
}
const loadingHTML = '<div class="lds-ellipsis lds"><div></div><div></div><div></div><div></div><div></div></div><br><div class="lds-ellipsis-reverse lds"><div></div><div></div><div></div><div></div><div></div></div>'
const loadingHTML2 = '<div class="lds-ring"><div></div><div></div><div></div><div></div></div>'
let labelsOnMap = true
map.createPane("vehiclePane")
const vehicleLayer = L.layerGroup([], { pane: "vehiclePane" }).addTo(map)
const labelGroup = L.layerGroup().addTo(map);
const zones = L.layerGroup().addTo(map);
const layerGroup = L.layerGroup().addTo(map);
const tempGroup = L.layerGroup().addTo(map);
const stopGroup = L.layerGroup([], { pane: "stops" }).addTo(map);
const previewGroup = L.layerGroup().addTo(map);

const redIcon = new L.Icon({
    iconUrl: 'img/endmarker.svg',
    iconSize: [20, 20],
    iconAnchor: [10, 20],
});
const greenIcon = new L.Icon({
    iconUrl: 'img/startmarker.svg',
    iconSize: [20, 20],
    iconAnchor: [10, 20],
});
let banned = { stops: [], trips: [], routes: [], agencies: [] }
let preferred = { routes: [], agencies: [] }
let unpreferred = { routes: [], agencies: [] }

const searcher = new MiniSearch({
    idField: "gtfsId",
    fields: ['name'],
    storeFields: ['name', 'gtfsId', '__typename'],
    searchOptions: {
        boost: { title: 2 },
        fuzzy: 0.2
    }
})
const viaSearcher = new MiniSearch({
    idField: "gtfsId",
    fields: ['name', 'code'],
    storeFields: ['name', 'gtfsId'],
    searchOptions: {
        boost: { title: 2 },
        fuzzy: 0.2
    }
})
let lines = []
let agencies = []
let parameters = []
let vehicles = []
let mqttInstances = []
let isPopupOpen = false
let stopsOnMap = true
let apiRunning = false
let pingError = false
let random = false
let repeat = false
let currentMode = 'main'
let viaStop = {"id": "", "type": ""}
let routes = []
let modes = ["BUS", "RAIL", "TRAM", "FERRY", "SUBWAY", "AIRPLANE", "COACH"]
const cooldown = 10000
let autocorrect1 = document.getElementById('autocorrect1')
let autocorrect2 = document.getElementById('autocorrect2')
let preferList = document.getElementById('preferSearch')
let viaList = document.getElementById('viaSearch')
const searchButton = document.getElementById('search')
const maincontent = document.getElementById('maincontent')
const options = document.getElementById('options')
const sb1 = document.getElementsByClassName('sb1')
const sb2 = document.getElementsByClassName('sb2')
const sb3 = document.getElementsByClassName('sb3')
const modePopup = document.getElementById("modePopup")
let mouseDown = false
inputIds = [false, false]
setValue(60.17664172012474, 24.656461728643194, "", 1)
setValue(60.294005904697535, 25.040987683425318, "", 2)

//getPreviousRoute()

const date = new Date()
document.getElementById('input3').value = padNumber(date.getHours()) + ':' + padNumber(date.getMinutes())
document.getElementById('input4').value = date.getFullYear() + '-' + padNumber(date.getMonth() + 1) + '-' + padNumber(date.getDate())

sidebarMode('main')
popup(false)
importData('hsl.json', importedData => addZones(importedData))
importData("searchParameters.json", data => addParameters(data[document.getElementById("apiSelect").value]))
recentSearches.add(getRecentSearches())
//Event listeners


searchButton.addEventListener('click', () => {
    api()
})
document.querySelector('.input1').addEventListener('mouseout', e => {
    autocorrect1.hidden = true
})
document.querySelector('.input1').addEventListener('mouseover', e => {
    autocorrect1.hidden = false
})
document.querySelector('.input2').addEventListener('mouseout', e => {
    autocorrect2.hidden = true
})
document.querySelector('.input2').addEventListener('mouseover', e => {
    autocorrect2.hidden = false
})
document.querySelector('.preferrer').addEventListener('mouseout', e => {
    preferList.hidden = true
})
document.querySelector('.preferrer').addEventListener('mouseover', e => {
    preferList.hidden = false
})
document.querySelector('.via').addEventListener('mouseout', e => {
    viaList.hidden = true
})
document.querySelector('.via').addEventListener('mouseover', e => {
    viaList.hidden = false
})
window.addEventListener('keydown', event => {
    if (event.key == 'Enter') {
        api()
        document.getElementById('error1').hidden = true
        document.getElementById('error2').hidden = true
    }
})
window.addEventListener('mousedown', event => {
    document.getElementById('error1').hidden = true
    document.getElementById('error2').hidden = true
})
document.getElementById('input1').addEventListener('keyup', event => {
    if (document.getElementById('input1').value.length > 1) {
        search(1)
    }
    autocorrect2.hidden = true
    autocorrect1.hidden = false
})

document.getElementById('input1').addEventListener('click', event => {
    if (document.getElementById('input1').value.length > 1) {
        search(1)
    }
})
document.getElementById('input2').addEventListener('keyup', event => {
    if (document.getElementById('input2').value.length > 1) {
        search(2)
    }
    autocorrect2.hidden = false
    autocorrect1.hidden = true
})
document.getElementById('input2').addEventListener('click', event => {
    if (document.getElementById('input2').value.length > 1) {
        search(2)
    }
})
document.getElementById('preferInput').addEventListener('keyup', event => {
    preferList.hidden = false
    preferSearch()
})
document.getElementById('viaInput').addEventListener('keyup', event => {
    viaList.hidden = false
    viaSearch()
})
document.getElementById('resizer').addEventListener('mousedown', e => {
    mouseDown = true
})
document.getElementById('resizer').addEventListener('touchstart', e => {
    mouseDown = true
})
document.getElementById('closePopup').addEventListener('click', e => {
    clearMap(false)
    popup(false)
})
document.getElementById('closeError').addEventListener('click', e => {
    document.getElementById('errorMessage').innerHTML = ''
    document.getElementById('error').style.top = '-10%'
})
document.getElementById('apiSelect').addEventListener('change', async e => {
    let value = document.getElementById('apiSelect').value
    document.getElementById('parameters').innerHTML = ""
    parameters = []
    if (value == "hslv2" || value == "finlandv2") {
        document.getElementById("preferrercontainer").style.display = 'none'
    }
    else {
        document.getElementById("preferrercontainer").style.display = 'block'
    }
    importData("searchParameters.json", data => addParameters(data[document.getElementById("apiSelect").value]))
})
document.getElementById("bussvgContainer").addEventListener("click", e => {
    if(modes.includes("BUS")){
        modes.splice(modes.indexOf("BUS"), 1)
        document.getElementById("bussvg").style.fill = "#a7a7a7"
    }
    else {
        modes.push("BUS")
        document.getElementById("bussvg").style.fill = "#007ac9"
    }
})
document.getElementById("trainsvgContainer").addEventListener("click", e => {
    if(modes.includes("RAIL")){
        modes.splice(modes.indexOf("RAIL"), 1)
        document.getElementById("trainsvg").style.fill = "#a7a7a7"
    }
    else {
        modes.push("RAIL")
        document.getElementById("trainsvg").style.fill = "#007ac9"
    }
})
document.getElementById("metrosvgContainer").addEventListener("click", e => {
    if(modes.includes("SUBWAY")){
        modes.splice(modes.indexOf("SUBWAY"), 1)
        document.getElementById("metrosvg").style.fill = "#a7a7a7"
    }
    else {
        modes.push("SUBWAY")
        document.getElementById("metrosvg").style.fill = "#ff6319"
    }
})
document.getElementById("tramsvgContainer").addEventListener("click", e => {
    if(modes.includes("TRAM")){
        modes.splice(modes.indexOf("TRAM"), 1)
        document.getElementById("tramsvg").style.fill = "#a7a7a7"
    }
    else {
        modes.push("TRAM")
        document.getElementById("tramsvg").style.fill = "#00985f"
    }
})
document.getElementById("ferrysvgContainer").addEventListener("click", e => {
    if(modes.includes("FERRY")){
        modes.splice(modes.indexOf("FERRY"), 1)
        document.getElementById("ferrysvg").style.fill = "#a7a7a7"
    }
    else {
        modes.push("FERRY")
        document.getElementById("ferrysvg").style.fill = "#00b9e4"
    }
})
document.getElementById("modesButton").addEventListener("click", e => {
    if(modePopup.classList.contains("hidden")){
        modePopup.classList.remove("hidden")
    }
    else {
        modePopup.classList.add("hidden")
    }
})
document.getElementById("closeModePopup").addEventListener("click", e => {
    modePopup.classList.add("hidden")
})
window.addEventListener('mouseup', e => {
    mouseDown = false
})
window.addEventListener('touchend', e => {
    mouseDown = false
})
window.addEventListener('mousemove', e => {
    if (mouseDown) {
        stopPopup.classList.add('notransition');
        stopPopup.style.top = `${e.clientY}px`
        stopPopup.style.height = `${window.innerHeight - e.clientY}px`
        stopPopup.offsetHeight;
        stopPopup.classList.remove('notransition');
    }
})
window.addEventListener('touchmove', e => {
    if (mouseDown) {
        stopPopup.classList.add('notransition');
        stopPopup.style.top = `${e.clientY}px`
        stopPopup.style.height = `${window.innerHeight - e.clientY}px`
        stopPopup.offsetHeight;
        stopPopup.classList.remove('notransition');
    }
})

async function reFormatStops() {
    const rawdata = await fetch(domain + '/stops', {
        headers: {
            "Access-Control-Allow-Origin": "*",
        }
    })
    let dataIN = await rawdata.json()
    let dataOUT = []
    for (let i = 0; i < dataIN.length; i++) {
        const element = dataIN[i];
        if (element.platform_code == '' || element.platform_code == undefined) {
            const text = `${element.stop_name}(${routeType(element.route_type).text})`
            dataOUT.push({ city: element.city, importance: element.importance, id: i + 1, name: element.stop_name, code: element.stop_code, type: routeType(element.route_type).text, color: routeType(element.route_type).color, text: text, position: [element.stop_lat, element.stop_lon], zone: element.zone_id, gtfsID: element.stop_id })
        } else {
            const text = `${element.stop_name}(platform ${element.platform_code})(${routeType(element.route_type).text})`
            dataOUT.push({ city: element.city, importance: element.importance, id: i + 1, name: element.stop_name, code: element.stop_code, type: routeType(element.route_type).text, color: routeType(element.route_type).color, text: text, position: [element.stop_lat, element.stop_lon], zone: element.zone_id, gtfsID: element.stop_id })
        }
    }
    download(dataOUT.splice(0, Math.floor(dataOUT.length / 2)), 'stops')
    download(dataOUT, 'stops2')
}
function download(json, filename) {
    const element = document.createElement('a')
    element.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(json))}`)
    const fileName = `${filename}.htv`
    element.setAttribute('download', fileName)
    element.click()
}


