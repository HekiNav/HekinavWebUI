




async function search(inputElement, display = true) {
    const input = document.getElementById('input' + inputElement).value
    const rawdata = await fetch('https://api.digitransit.fi/geocoding/v1/autocomplete?digitransit-subscription-key=a1e437f79628464c9ea8d542db6f6e94&text=' + input)
    const result = await rawdata.json()
    const features = result.features
    let autocorrect
    let otherAutocorrect
    if (inputElement == 1) {
        autocorrect = document.getElementById('autocorrect1')
        otherAutocorrect = document.getElementById('autocorrect2')
    } else {
        autocorrect = document.getElementById('autocorrect2')
        otherAutocorrect = document.getElementById('autocorrect1')
    }
    otherAutocorrect.innerHTML = ''
    autocorrect.innerHTML = ''
    if (features.length < 1 && display) {

        const header = document.createElement('div')
        header.classList.add('stopRow')

        const h3 = document.createElement('h3')
        h3.textContent = 'Recent searches'
        header.append(h3)
        autocorrect.append(header)

        const row = document.createElement('div')
        row.classList.add('hidden')

        autocorrect.append(row)

        console.log('recent')
        console.log(recentSearches)
        for (let i = recentSearches.length - 1; i > -1 && i < 100; i--) {
            const element = recentSearches[i];

            const row = document.createElement('div')
            row.classList.add('resultRow')

            const name = document.createElement('div')
            name.classList.add('resultName')
            name.textContent = element.name

            row.append(name)
            row.addEventListener('click', e => {
                setValue(element.lat, element.lon, element.name, inputElement);
                map.flyTo([element.lat, element.lon])
                stopTiles.redraw()
            })
            autocorrect.append(row)
        }
    } else if (display) {
        const row = document.createElement('div')
        row.classList.add('resultRow')

        const name = document.createElement('div')
        name.classList.add('TEMP')
        name.textContent = 'Name'

        row.append(name)
        autocorrect.append(row)
        for (let i = 0; i < features.length && i < 100; i++) {
            const element = features[i].properties;
            if (element.addendum && !element.addendum.GTFS) console.log(element.addendum)

            const row = document.createElement('div')
            row.classList.add('resultRow')

            const type = document.createElement('div')
            type.classList.add('resultType')
            type.style.backgroundImage = `url(img/icons/${getIcon(element.layer == "stop" ? "station" : element.layer, element.addendum)}.svg)`

            const name = document.createElement('div')
            name.classList.add('resultName')
            name.textContent = element.name

            const area = document.createElement('div')
            area.classList.add('resultArea')
            area.textContent = (element.neighbourhood ? element.neighbourhood + ", " : "") + (element.localadmin ? element.localadmin : "") + (!element.neighbourhood ? ", " + element.region : "")


            row.append(type)
            row.append(name)
            row.append(area)
            element.lat = features[i].geometry.coordinates[1]
            element.lon = features[i].geometry.coordinates[0]
            row.addEventListener('click', e => {
                setValue(features[i].geometry.coordinates[1], features[i].geometry.coordinates[0], element.name, inputElement);
                recentSearches.add(element)
                map.flyTo([element.lat, element.lon], map.getZoom(), { duration: 0.5 })
                stopTiles.redraw()
            })
            autocorrect.append(row)
        }
    } else {
        setValue(features[0].geometry.coordinates[1], features[0].geometry.coordinates[0], features[0].properties.name, inputElement);
    }

}
async function preferSearch() {
    const input = document.getElementById('preferInput').value
    let query = `
{
  stops(name: "${input}") {
    cluster {
      gtfsId
      name
      __typename
    }
  }
  routes{
    agency {
        name
    }
    gtfsId
    shortName
    longName
    __typename
  }
  agencies{
    gtfsId
    name
    __typename
  }
}`
    if (lines.length && agencies.length) query = `
{
  stops(name: "${input}") {
    cluster {
      gtfsId
      name
      __typename
    }
  }
}`
    const rawdata = await fetch('https://api.digitransit.fi/routing/v1/routers/finland/index/graphql?digitransit-subscription-key=a1e437f79628464c9ea8d542db6f6e94', {
        method: "POST",
        headers: {
            "content-type": "application/graphql"
        },
        body: query
    })
    const result = await rawdata.json()
    console.log(result)
    const clusters = result.data.stops.filter((value, index, self) =>
        index === self.findIndex((t) => (
            t.cluster.id === value.cluster.id
        ))
    )
    let results = clusters.map(c => c.cluster)
    results = results.concat(
        lines.length ? lines : result.data.routes.map(r => { r.name = r.shortName ? (r.agency.name == "Helsingin seudun liikenne" ? "HSL" : r.agency.name) + " " + r.shortName + " " + r.longName : (r.agency.name == "Helsingin seudun liikenne" ? "HSL" : r.agency.name) + " " + r.longName; return r }),
        agencies.length ? agencies : result.data.agencies
    )
    //remove Pori:1001 cuz that is a duplicate blame digitransit
    //its just a lot faster to just manually remove that one as its the only duplicate
    //if there appear more then ig just uncomment the bottom one
    results = results.filter(element => { return element.gtfsId != "Pori:1001" })
    /*results = results.filter((value, index, self) =>
        index === self.findIndex((t) => (
          t.gtfsId === value.gtfsId
        ))
    )*/
    searcher.removeAll()
    console.log(results)

    searcher.addAll(results)
    const searched = searcher.search(input)
    console.log(searched)
    if (!lines.length && !agencies.length) {
        agencies = result.data.agencies
        lines = result.data.routes
    }
    const container = document.getElementById("preferSearch")
    container.innerHTML = ""
    searched.forEach(item => {
        let type
        switch (item.__typename.toLowerCase()) {
            case "cluster":
                type = "stops"
                break;
            case "route":
                type = "routes"
                break;
            case "agency":
                type = "agencies"
                break;
            default:
                break;
        }
        const row = document.createElement("div")
        row.classList.add("preferSearchRow")
        const text = document.createElement("span")
        text.textContent = item.name
        const buttons = document.createElement("div")
        buttons.classList.add("preferrerButtons")
        const banButton = document.createElement("button")
        banButton.classList.add("button")
        banButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="red"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>`
        banButton.addEventListener("click", e => {
            const i = banned[type].findIndex(e => e == item.gtfsId)
            if (i >= 0) {
                banned[type].splice(i, 1)
                banButton.querySelector("svg").setAttribute("stroke", "red")
                banButton.style.background = "white"
            } else {
                banned[type].push(item.gtfsId)
                banButton.querySelector("svg").setAttribute("stroke", "white")
                banButton.style.background = "red"
            }
        })
        const unPreferButton = document.createElement("button")
        unPreferButton.classList.add("button")
        unPreferButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="orange"> <path stroke-linecap="round" stroke-linejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54" /></svg>`
        unPreferButton.addEventListener("click", e => {
            const i = unpreferred[type].findIndex(e => e == item.gtfsId)
            if (i >= 0) {
                unpreferred[type].splice(i, 1)
                unPreferButton.querySelector("svg").setAttribute("stroke", "orange")
                unPreferButton.style.background = "white"
            } else {
                unpreferred[type].push(item.gtfsId)
                unPreferButton.querySelector("svg").setAttribute("stroke", "white")
                unPreferButton.style.background = "orange"
            }
        })
        const preferButton = document.createElement("button")
        preferButton.classList.add("button")
        preferButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="green" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" /></svg>`
        preferButton.addEventListener("click", e => {
            const i = preferred[type].findIndex(e => e == item.gtfsId)
            if (i >= 0) {
                preferred[type].splice(i, 1)
                preferButton.querySelector("svg").setAttribute("stroke", "green")
                preferButton.style.background = "white"
            } else {
                preferred[type].push(item.gtfsId)
                preferButton.querySelector("svg").setAttribute("stroke", "white")
                preferButton.style.background = "green"
            }
        })
        switch (type) {
            case "stops":
                if (banned[type].find(e => e == item.gtfsId)) { banButton.querySelector("svg").setAttribute("stroke", "white"); banButton.style.background = "red" }
                buttons.append(banButton)
                buttons.style.setProperty("--e", 1)
                break;
            case "agencies":
            case "routes":
                if (banned[type].find(e => e == item.gtfsId)) { banButton.querySelector("svg").setAttribute("stroke", "white"); banButton.style.background = "red" }
                if (unpreferred[type].find(e => e == item.gtfsId)) { unPreferButton.querySelector("svg").setAttribute("stroke", "white"); unPreferButton.style.background = "red" }
                if (preferred[type].find(e => e == item.gtfsId)) { preferButton.querySelector("svg").setAttribute("stroke", "white"); preferButton.style.background = "red" }
                buttons.append(preferButton, unPreferButton, banButton)
                break;
            default:
                break;
        }
        row.append(text, buttons)
        container.append(row)
    })
}
async function viaSearch() {
    const input = document.getElementById('viaInput').value
    const query = `{
    stops(name: "${input}") {
    gtfsId
    name
    platformCode
    vehicleMode
    code
    }
    }`

    const result = await fetch('https://api.digitransit.fi/routing/v1/routers/finland/index/graphql?digitransit-subscription-key=a1e437f79628464c9ea8d542db6f6e94', {
        method: "POST",
        headers: {
            "content-type": "application/graphql"
        },
        body: query
    }).then(result => result.json())
        .then(result => result.data.stops)

    viaSearcher.removeAll()
    viaSearcher.addAll(result)
    const searched = viaSearcher.search(input)

    const container = document.getElementById("viaSearch")
    container.innerHTML = ""
    searched.forEach(item => {
        const row = document.createElement("div")
        row.classList.add("viaSearchRow")
        const text = document.createElement("span")
        text.textContent = item.name
        const buttons = document.createElement("div")
        buttons.classList.add("viaButtons")
        const viaButton = document.createElement("p")
        viaButton.classList.add("viaButton")
        viaButton.textContent = "VIA"
        if (viaStop.id == item.gtfsId && viaStop.type == "via") {
            viaButton.style.color = "#000000"
            viaButton.style.backgroundColor = "#d2d2d2"
        }
        viaButton.addEventListener("click", e => {
            if (viaStop.id == item.gtfsId) {
                if (viaStop.type == "via") {
                    viaButton.style.color = '#818181'
                    viaButton.style.backgroundColor = ""
                    viaStop.id = ""
                }
                else {
                    Array.from(document.getElementsByClassName("viaButton")).forEach(via => {
                        via.style.color = "#818181"
                        via.style.backgroundColor = ""
                    })
                    Array.from(document.getElementsByClassName("visitButton")).forEach(visit => {
                        visit.style.color = "#818181"
                        visit.style.backgroundColor = ""
                    })
                    viaButton.style.color = "#000000"
                    viaButton.style.backgroundColor = "#d2d2d2"
                    viaStop.type = "via"
                }

            }
            else {
                Array.from(document.getElementsByClassName("viaButton")).forEach(via => {
                    via.style.color = "#818181"
                    via.style.backgroundColor = ""
                })
                Array.from(document.getElementsByClassName("visitButton")).forEach(visit => {
                    visit.style.color = "#818181"
                    visit.style.backgroundColor = ""
                })
                viaButton.style.color = "#000000"
                viaButton.style.backgroundColor = "#d2d2d2"
                viaStop.id = item.gtfsId
                viaStop.type = "via"
            }
            if (viaStop.type == "visit" && viaStop.id != "") {
                document.getElementById("timeforvisit(s)Container").style.display = "block"
            }
            else {
                document.getElementById("timeforvisit(s)Container").style.display = "none"
            }
        })
        const visitButton = document.createElement("p")
        visitButton.classList.add("visitButton")
        visitButton.textContent = "VISIT"
        if (viaStop.id == item.gtfsId && viaStop.type == "visit") {
            visitButton.style.color = "#000000"
            visitButton.style.backgroundColor = "#d2d2d2"
        }
        visitButton.addEventListener("click", e => {
            if (viaStop.id == item.gtfsId) {
                if (viaStop.type == "visit") {
                    visitButton.style.color = '#818181'
                    visitButton.style.backgroundColor = ""
                    viaStop.id = ""
                }
                else {
                    Array.from(document.getElementsByClassName("viaButton")).forEach(via => {
                        via.style.color = "#818181"
                        via.style.backgroundColor = ""
                    })
                    Array.from(document.getElementsByClassName("visitButton")).forEach(visit => {
                        visit.style.color = "#818181"
                        visit.style.backgroundColor = ""
                    })
                    visitButton.style.color = "#000000"
                    visitButton.style.backgroundColor = "#d2d2d2"
                    viaStop.type = "visit"
                }
            }
            else {
                Array.from(document.getElementsByClassName("viaButton")).forEach(via => {
                    via.style.color = "#818181"
                    via.style.backgroundColor = ""
                })
                Array.from(document.getElementsByClassName("visitButton")).forEach(visit => {
                    visit.style.color = "#818181"
                    visit.style.backgroundColor = ""
                })
                visitButton.style.color = "#000000"
                visitButton.style.backgroundColor = "#d2d2d2"
                viaStop.id = item.gtfsId
                viaStop.type = "visit"
            }
            if (viaStop.type == "visit" && viaStop.id != "") {
                document.getElementById("timeforvisit(s)Container").style.display = "block"
            }
            else {
                document.getElementById("timeforvisit(s)Container").style.display = "none"
            }
        })

        buttons.append(viaButton)
        buttons.append(visitButton)
        row.append(text, buttons)
        container.append(row)
    })

}
function getIcon(type, data) {
    if (data) {
        return `${type}.${data.GTFS.modes[0].toLowerCase()}`
    }
    switch (type) {
        case "address":
            return "pin"
        case "venue":
            return "venue"
        case "street":
            return "street"
        case "localadmin":
        case "neighbourhood":
        case "region":
            return "area"
        default:
            console.log(type)
            return "none"
    }
}
function addStop(stop) {
    if (stop.position[0] == undefined || stop.position[1] == undefined) {
        invalidStops.push(stop)
    } else {
        const marker = L.circleMarker(stop.position, {
            renderer: canvasRenderer,
            color: stop.color,
            radius: 2,
            fillColor: stop.color,
            fillOpacity: 1,
        }).on('click', () => { popup(true, stop); getDepartures(stop, stopPopupC) })
        marker.show = stop.importance
        marker.onMap = true
        marker.addTo(stopGroup)
    }
}
function loadStops(data, data2) {
    console.time('Stops')
    console.time('s1')
    if (data2) {
        data = data.concat(data2)
    }
    stops = data
    console.timeEnd('s1')
    console.time('s2')
    stops.sort((a, b) => a.importance - b.importance)
    if (stops.length > 0) {
        for (let i = 0; i < stops.length; i++) {
            addStop(stops[i])
        }
    }
    console.timeEnd('s2')
    console.time('s3')
    document.querySelector('body').style.cursor = ''
    console.timeEnd('s3')
    console.time('s4')
    searchIndex.addAll(stops);
    console.timeEnd('s4')
    console.timeEnd('Stops')
}

function sidebarMode(mode) {
    
}



function setValue(lat, lon, display, field) {
    if (field == 1) {
        values.from = { lat: lat, lon: lon, display: display }
        autocorrect1.hidden = true
        document.getElementById('input1').value = display
    } else if (field == 2) {
        values.to = { lat: lat, lon: lon, display: display }
        autocorrect2.hidden = true
        document.getElementById('input2').value = display
    }
}
function getRecentSearches() {
    if (localStorage.getItem('search')) {
        return JSON.parse(localStorage.getItem('search'))
    }
    return null
}
function saveRecentSearches(data) {
    localStorage.setItem('search', JSON.stringify(data))
}
function setError(error = { code: undefined, message: '' }, timer) {
    const popup = document.getElementById('errorMessage')
    console.trace(error)
    if (error.code) {
        popup.innerHTML = `<span style="font-weight:bold;padding-right:5px">${error.code}</span><span style="overflow-inline:hidden;text-overflow:ellipsis;height:4vh" title="` + `${error.message}` + `">${error.message}</span>`
    } else {
        popup.innerHTML = error.message
    }
    document.getElementById('error').style.top = '0'
    if (timer) {
        setTimeout(function () {
            document.getElementById('errorMessage').innerHTML = ''
            document.getElementById('error').style.top = '-10%'
        }, timer)
    }
}


function renderVehicle(isHsl, data, topic) {
    if (isHsl) {
        const id = topic[7] + topic[8]
        const values = Object.values(data)[0]
        const pV = vehicles.find(e => id == e.id)
        if (!values.lat || !values.long) return
        if (!pV) {
            const marker = L.marker([values.lat, values.long], {
                pane: "vehiclePane",
                icon: L.divIcon({
                    html: image.vehicle(25, Util.routeType(topic[6]).color, values.hdg, values.desi),
                    iconSize: [25, 25],
                    className: "vehicle-marker"
                })
            })
            vehicles.push({ data: values, marker: marker, id: id })
            marker.addTo(vehicleLayer)
        } else {
            pV.data = values
            pV.marker.setLatLng([values.lat, values.long])
        }
    } else /* Digitransit */ {
        console.log(data, topic)
        const id = topic[10]
        const pV = vehicles.find(e => id == e.id)
        const veh = data.entity[0].vehicle
        const pos = { lat: veh.position.latitude, lon: veh.position.longitude }

        if (!pos.lat || !pos.lon) return
        if (!pV) {
            console.log(topic[20].length ? topic[20] : Util.routeType(topic[6]).color, topic[19])
            const marker = L.marker([pos.lat, pos.lon], {
                pane: "vehiclePane",
                icon: L.divIcon({
                    html: image.vehicle(25, topic[20].length ? topic[20] : Util.routeType(topic[6]).color, 0, topic[19]),
                    iconSize: [25, 25],
                    className: "vehicle-marker"
                })
            })
            vehicles.push({ data: data, marker: marker, id: id })
            marker.addTo(vehicleLayer)
        } else {
            pV.data = data
            pV.marker.setLatLng([pos.lat, pos.lon])
        }
    }
}
function viewRoute(i, click) {
    popup(false)
    const route = routes[i]
    clearMap()
    ///CLICK ONLY
    if (click) {
        console.log("CLICK")
        document.getElementById('route').innerHTML = route.html
        sidebarMode('route')
        map.flyToBounds(route.bbox, 1)
        vehicles.length = 0
        vehicleLayer.clearLayers()
        mqttInstances.forEach(i => i.end())
        route.trips.forEach(t => {
            if (!t.id) return
            const isHsl = t.id.split(":")[0].toLowerCase() == "hsl"

            mqttInstances.push(
                new realtimeHandler(
                    isHsl ? "wss://mqtt.hsl.fi:443/" : "wss://mqtt.digitransit.fi:443/",
                    isHsl ?  /* HSL query */`/hfp/v2/journey/ongoing/+/+/+/+/${t.routeId.split(":")[1]}/${t.direction + 1}/+/${sToTime(t.tripStart)}/#` :
                      /* digitransit query*/`/gtfsrt/vp/${t.id.split(":")[0]/* feed string part */}/+/+/+/${t.routeId.split(":")[1]/* number part */}/+/+/+/+/${sToTime(t.tripStart)}/#`,
                    isHsl ? "JSON" : "GTFSRT",
                    (data, topic) => {
                        renderVehicle(isHsl, data, topic)
                    }
                )
            )
        })

    }//HOVER ONLY
    else {
        routes.forEach(r => {
            if (r != route) {
                for (let k = 0; k < r.trips.length; k++) {
                    const trip = r.trips[k];
                    renderPolyline(L.Polyline.fromEncoded(trip.shape).getLatLngs(), '#555')
                }
            }
        })
    }
    //BOTH
    let direction = 'left'
    for (let j = 0; j < route.trips.length; j++) {
        const trip = route.trips[j];
        //polyline
        const polyline = renderPolyline(L.Polyline.fromEncoded(trip.shape).getLatLngs(), trip.color)
        //Add route label
        if (trip.Util.routeType != "WALK") {
            let latlons = []
            polyline._latlngs.forEach(latlng => {
                if (map.getBounds().contains(latlng)) {
                    latlons.push(latlng)
                }
            })
            const latlon = latlons[Math.floor(latlons.length / 2)]
            if (latlon) {
                const label = L.marker(latlon, {
                    interactive: true,
                    icon: L.divIcon({
                        className: 'label',
                        html: `<div height="20" style="width:${trip.routeName.length * 8 + 8}px;background-color:${trip.color};" class="route-name"><h1>${trip.routeName}</h1></div>`
                    })
                }).addTo(tempGroup)
            }
        }
        //CLICK ONLY
        if ((j == 0 || j == route.trips.length - 1) && click) {
            //Add start and end markers
            if (j == 0) {
                L.marker({ lat: trip.fromCoords.lat, lon: trip.fromCoords.lon }, { icon: greenIcon }).addTo(layerGroup);
            } else {
                L.marker({ lat: trip.toCoords.lat, lon: trip.toCoords.lon }, { icon: redIcon }).addTo(layerGroup);
            }

        }
        //Stops
        const marker = renderCircle({ lat: trip.fromCoords.lat, lon: trip.fromCoords.lon }, trip.color, false, true)
        //Add a popup to tell walking and waiting times
        if (trip.popUpTime > 10) {
            if (direction == 'right') {
                direction = 'left'
            } else if (direction == 'left') {
                direction = 'right'
            }
            marker.bindTooltip(`${trip.popUpType == "WALK" ? `${image.walk(12)} ${sToHMinS(trip.popUpTime)}` : `${image.wait(12)} ${sToHMinS(trip.popUpTime)}`}`, {
                opacity: 1.0,
                sticky: true,
                permanent: true,
                direction: direction,
            }).openTooltip()
        }
        /*const transfer = route.transfers[j]
        console.log(transfer)
        marker.bindTooltip(`${transfer.walk ? `${image.walk(12)}${sToHMinS(transfer.walk)}` : ''} ${transfer.wait ? `${image.wait(12)}${sToHMinS(transfer.wait)}` : ''}`, {
            opacity: 1.0,
            sticky: false,
            permanent: true
        }).openTooltip()*/
        if (click) {
            renderCircle({ lat: trip.toCoords.lat, lon: trip.toCoords.lat }, trip.color, false)
        }
    }
}

function moveHandler(e, polyline) {
    const a = 2000000
    const b = 10000
    const clickBounds = [[e.latlng.lat - b / (map.getZoom() * a), e.latlng.lng - b / (map.getZoom() * a)], [e.latlng.lat + b / (map.getZoom() * a), e.latlng.lng + b / (map.getZoom() * a)]]
    const routes = [];
    const lines = []
    let labels = ""
    tempGroup.eachLayer(l => {
        if (polylineIntersects(l._latlngs, clickBounds)) routes.push(l.route)
    })
    labels += `<div class="route-tooltip">`
    routes.forEach(r => {
        const name = r.shortName || Util.routeType(r.gtfsType).text
        if (lines.find(e => { return (e.name == name && e.color == Util.routeType(r.type).color && e.headsign == r.headsign) })) return
        lines.push({ headsign: r.headsign, name: name, color: Util.routeType(r.type).color, o: r })
        labels += `<span height="20" style="width:${name ? name.length * 8 + 8 : Util.routeType(r.gtfsType).text.length * 8 + 8}px;border-color:${Util.routeType(r.type).color};background-color:${Util.routeType(r.type).color};" class="route-label"><h1>${name}</h1></span>`
    })
    labels += `</div>`
    polyline.openTooltip(e.latlng).setTooltipContent(labels)
}



function apiNameToUrl(apiName) {
    
}

function addParameters(data) {
    data.forEach(p => {
        parameters.push(
            new SearchParameter(p)
        )
    })
    const container = document.getElementById("parameters")
    parameters.forEach(p => {
        container.appendChild(p.element)
    })
    //this stuff could be somewhere else
    const value = document.getElementById("apiSelect").value
    if (value == "hslv2" || value == "finlandv2") {
        document.getElementById("preferrercontainer").style.display = 'none'
        document.getElementById("viacontainer").style.display = 'block'
        if (viaStop.type != "visit" || viaStop.id == "") {
            document.getElementById("timeforvisit(s)Container").style.display = "none"
        }
        else {
            document.getElementById("timeforvisit(s)Container").style.display = "block"
        }
    }
    else {
        document.getElementById("preferrercontainer").style.display = 'block'
        document.getElementById("viacontainer").style.display = 'none'
    }
}
class SearchParameter {
    constructor(o) {
        this.type = o.type
        if (o.type == "number") {
            this.min = o.min
            this.max = o.max
        }
        this.label = o.label
        this.default = o.default
        this.graphqlName = o.graphqlName
        this.graphqlCategory1 = o.graphqlCategory1
        this.graphqlCategory2 = o.graphqlCategory2
        this.graphqlCategory3 = o.graphqlCategory3
        this.id = encodeURIComponent(this.label.replaceAll(" ", "").toLowerCase())
        this.element = this.#createElements()
    }
    #createElements() {
        const container = document.createElement("div")
        container.id = this.id + "Container"
        const label = document.createElement("label")
        label.setAttribute("for", this.id)
        label.textContent = this.label + " "
        const input = document.createElement("input")
        input.id = this.id
        input.setAttribute("type", this.type)
        if (this.type == "number") {
            input.value = this.default
            input.setAttribute("min", this.min)
            input.setAttribute("max", this.max)
            input.addEventListener("change", function () {
                let v = parseFloat(this.value);
                if (v < this.min) this.value = this.min
                if (v > this.max) this.value = this.max
            })
            container.append(label, input)
        }
        if (this.type == "checkbox") {
            input.checked = this.default
            const slider = document.createElement("span")
            slider.classList.add("slider")
            const background = document.createElement("label")
            background.classList.add("switch")
            background.append(input, slider)
            container.append(label, background)
        }
        return container
    }
    get value() {
        const input = this.element.querySelector("input")
        switch (this.type) {
            case "number":
                return parseFloat(input.value)
            case "checkbox":
                return input.checked
            default:
                return input.value
        }
    }
}