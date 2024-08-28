function padNumber(d) {
    return (d < 10) ? '0' + d.toString() : d.toString();
}
async function importData(jsonFile, fn) {
    const data = await fetch('./data/' + jsonFile)
    fn(await data.json())
}
function addZones(json) {
    let labels = json.labels
    labels.forEach(label => {
        var label = L.marker({ lat: label.lat, lon: label.lng }, {
            interactive: false,
            icon: L.divIcon({
                className: 'label',
                html: '<div width="20" height="20" class="labels"><h1>' + label.zone + '</h1></div>'
            })
        }).addTo(labelGroup)
    })
    //Thicker transparent line
    L.geoJSON(json, {
        interactive: false,
        style: function () {
            return {
                fillColor: '#0000',
                stroke: true,
                weight: 6,
                fill: true,
                color: 'rgba(0,0,0,0.2)'
            };
        }
    }).addTo(zones)
    //Thinner line
    L.geoJSON(json, {
        interactive: false,
        style: function () {
            return {
                fillColor: '#0000',
                stroke: true,
                weight: 1,
                fill: true,
                color: 'rgba(0,0,0,1)'
            };
        }
    }).addTo(zones)
}
async function getDepartures(stop, stopPopup) {
    if (!depsRunning) {
        timeouts.forEach(timeout => {
            clearTimeout(timeout)
        })
        gen++
        depsRunning = true
        let data
        console.time(`loading departures for ${stop.text}`)
        let rawdata = null
        const query = `{\"query\":\"{  stop(id: \\\"${stop.gtfsId}\\\") {routes{gtfsId}patterns{route{type shortName}geometry{lat lon}} name code lat lon alerts {route{shortName}}stoptimesWithoutPatterns(numberOfDepartures: 100) {stop {platformCode} serviceDay headsign scheduledArrival scheduledDeparture realtimeState realtimeArrival realtimeDeparture trip { tripHeadsign pattern{ geometry { lat lon}} route { type   longName     shortName        }      }      headsign    }  }}\"}`
        try {
            rawdata = await fetch("https://api.digitransit.fi/routing/v1/routers/finland/index/graphql?digitransit-subscription-key=a1e437f79628464c9ea8d542db6f6e94", { "credentials": "omit", "headers": { "Content-Type": "application/json", }, "body": query, "method": "POST", });
            data = await rawdata.json()
        } catch (error) {
            popup(false)
            setError({ code: (rawdata ? rawdata.status : ''), message: (data ? data.message : 'Could not connect to the Hekinav Routing Services') }, 10000)
        }
        let popupText
        let reload = true
        if (data) {
            if (data.errors) {
                setError({ code: rawdata.status, message: data.errors[0].message }, 30000)
            } else {
                const deps = data.data.stop.stoptimesWithoutPatterns
                //removes entries which have passed more than 60 seconds ago (why does digitransit even have those)
                // loop goes backward so indices don't change when removing something
                const date = new Date().getHours() * 3600 + new Date().getMinutes() * 60 + new Date().getSeconds()
                const dateInUnix = new Date().setHours(0, 0, 0, 0) / 1000
                for (let i = deps.length - 1; i > -1; i--) {
                    if (deps[i].realtimeArrival < date - 60 && deps[i].serviceDay <= dateInUnix) {
                        deps.splice(i, 1);
                    }
                }
                if (data.data.stop.stoptimesWithoutPatterns.length > 0) {
                    clearMap()
                    renderShapes(data.data.stop.patterns)
                    data.data.stop.routes.forEach(r => {
                        realtimeRoute(r.gtfsId, (data, topic, isHsl) => {
                            if (isHsl) {
                                const id = topic[7] + topic[8]
                                const values = Object.values(data)[0]
                                const pV = vehicles.find(e => id == e.id)
                                if (!values.lat || !values.long) return
                                if (!pV) {
                                    const marker = L.marker([values.lat,values.long], {
                                        pane: "vehiclePane",
                                        icon: L.divIcon({
                                            html: image.vehicle(25, routeType(topic[6]).color, values.hdg, values.desi),
                                            iconSize: [25,25],
                                            className: "vehicle-marker"
                                        })
                                    })
                                    vehicles.push({data: values, marker: marker, id: id})
                                    marker.addTo(vehicleLayer)
                                } else {
                                    pV.data = values
                                    pV.marker.setLatLng([values.lat,values.long])
                                }
                            } else if (data.entity[0].vehicle) {
                                const id = topic[10]
                                const pV = vehicles.find(e => id == e.id)
                                const veh = data.entity[0].vehicle
                                const pos = {lat: veh.position.latitude, lon: veh.position.longitude}

                                if (!pos.lat || !pos.lon) return
                                if (!pV) {
                                    console.log(topic[20].length ? topic[20] : routeType(topic[6]).color, topic[19])
                                    const marker = L.marker([pos.lat,pos.lon], {
                                        pane: "vehiclePane",
                                        icon: L.divIcon({
                                            html: image.vehicle(25, topic[20].length ? topic[20] : routeType(topic[6]).color, 0, topic[19]),
                                            iconSize: [25,25],
                                            className: "vehicle-marker"
                                        })
                                    })
                                    vehicles.push({data: data, marker: marker, id: id})
                                    marker.addTo(vehicleLayer)
                                } else {
                                    pV.data = data
                                    pV.marker.setLatLng([pos.lat,pos.lon])
                                }
                            } else console.log(data)
                        }, gen)
                    })
                    popupText = `<h3>${stop.code ? stop.code : ""} ${stop.text}</h3><table><tr><td class="stop-routes">${stop.labels}</td></tr>
                             <tr><td><button onclick="setValue(${JSON.stringify(stop.position)},'${stop.name}',1)">Set as origin</button><button onclick="setValue(${JSON.stringify(stop.position)},'${stop.name}',2)">Set as destination</button></td></tr></table><table>`
                    popupText += '<tr><th>Departures</th></tr>'

                    let platforms = false
                    deps.forEach(dep => {
                        if (dep.stop.platformCode) {
                            platforms = true
                            return
                        }
                    })
                    let latency = false
                    deps.forEach(dep => {
                        if (dep.realtimeState == "UPDATED") {
                            latency = true
                            return
                        }
                    })

                    //sort by date then time
                    deps.sort((a, b) => {
                        if (a.serviceDay < b.serviceDay) return -1;
                        if (a.serviceDay > b.serviceDay) return 1;

                        if (a.realtimeArrival < b.realtimeArrival) return -1;
                        if (a.realtimeArrival > b.realtimeArrival) return 1;
                        // Both idential, return 0
                        return 0;
                    });

                    popupText += `<tr>${platforms ? '<th>Platform</th>' : ''}<th>Route</th><th>Estimated time</th><th>Scheduled time</th>${latency ? '<th>Latency</th>' : ''}</tr>`

                    for (let i = 0; i < deps.length; i++) {
                        const dep = deps[i];
                        dep.latency = dep.realtimeArrival - dep.scheduledArrival
                        const latencyMin = Math.floor(dep.latency / 60)
                        if (dep.realtimeState == "SCHEDULED") {
                            dep.status = "UNKNOWN"
                        } else if (latencyMin <= 1 && latencyMin >= -1) {
                            dep.status = "ON_TIME"
                        } else if (latencyMin < 1) {
                            dep.status = "EARLY"
                        } else if (latencyMin > 3) {
                            dep.status = "DELAY_LARGE"
                        } else if (latencyMin > 0) {
                            dep.status = "DELAY_SMALL"
                        }
                        const date = new Date().getHours() * 3600 + new Date().getMinutes() * 60 + new Date().getSeconds()
                        const diff = dep.realtimeArrival - date;
                        if (diff < 600 && dep.status != 'UNKNOWN') {
                            changeDepTime(dep.realtimeArrival, 'time' + i, stopPopup, stop, gen)
                            reload = null
                        }
                        if (diff < 400) reload = false
                        const tomorrow = dep.serviceDay > dateInUnix
                        if (diff >= -60 | tomorrow) {
                            popupText += `<tr>${platforms ? `<td class="center">${dep.stop.platformCode}</td>` : ''}
                                    <td><span class="depRoute"style="background-color:${routeType(dep.trip.route.type).color}">${dep.trip.route.shortName || dep.trip.route.longName}</span>&nbsp${dep.headsign || dep.trip.tripHeadsign}</td>
                                    <td class="center time${i} ${dep.status}">${tomorrow ? "tomorrow " + sToTime(dep.realtimeArrival) : sToTime(dep.realtimeArrival)}</td><td class="center">${sToTime(dep.scheduledArrival)}</td>
                                    ${dep.status == 'UNKNOWN' ? '</tr>' : `<td class="center ${dep.status}">${dep.latency < 0 ? Math.floor(dep.latency / 60) : "+" + Math.floor(dep.latency / 60)}&nbspmin</td></tr>`}`
                        }
                    }
                    popupText += '</table>'
                } else {
                    popupText = `<h3>${stop.code ? stop.code : ""} ${stop.text}</h3><table><tr><td class="stop-routes">${stop.labels}</td></tr>
                             <tr><td><button onclick="setValue(${JSON.stringify(stop.position)},'${stop.name}',1)">Set as origin</button><button onclick="setValue(${JSON.stringify(stop.position)},'${stop.name}',2)">Set as destination</button></td></tr></table><table>`
                    popupText += '<tr><th>This station has no departures</th></tr>'
                }
            }
            console.timeEnd(`loading departures for ${stop.text}`)
            if (isPopupOpen && reload == true) {
                timeouts.push(setTimeout((stop, stopPopup, g) => {
                    if (isPopupOpen && gen == g) {
                        getDepartures(stop, stopPopup)
                    }
                }, 30000, stop, stopPopup, gen))
            }
            stopPopupC.innerHTML = popupText
            const labels = document.querySelector(".stop-routes").children
            for (let i = 0; i < labels.length; i++) {
                const label = labels.item(i);
                label.addEventListener("click", e => {
                    if (label.selected) {
                        label.selected = false
                    } else {
                        label.selected = true
                    }
                    for (let i = 0; i < labels.length; i++) {
                        const l = labels.item(i)
                        if (l.selected) {
                            l.style.backgroundColor = l.style.borderColor
                        } else {
                            l.style.backgroundColor = "gray"
                        }

                    }
                })
                label.addEventListener("dblclick", e => {
                    for (let i = 0; i < labels.length; i++) {
                        const l = labels.item(i)
                        l.style.backgroundColor = l.style.borderColor
                        l.selected = false
                    }
                })
            }
            setTimeout(e => {
                depsRunning = false
            }, 500)
        }
    }
}
function changeDepTime(dep_date, className, popup, stop, v) {
    const elementList = document.getElementsByClassName(className)
    for (let i = 0; i < elementList.length; i++) {
        const element = elementList.item(i);
        const date = new Date().getHours() * 3600 + new Date().getMinutes() * 60 + new Date().getSeconds()
        const diff = dep_date - date;

        if (diff <= -60) {
            getDepartures(stop, popup)
        } else if (diff <= 0) {
            element.innerHTML = "Now"
        } else {
            element.innerHTML = `&nbsp${Math.floor(diff / 60)}&nbspmin ${Math.floor((diff % 60))}&nbsps&nbsp${sToTime(dep_date)}`
        }
    }
    if (isPopupOpen && v == gen) {
        setTimeout(changeDepTime, 1000, dep_date, className, popup, stop, v)    
    } else {
        for (let i = 0; i < elementList.length; i++) {
            const element = elementList.item(i);
            element.classList.remove(className)
        }
        return
    }
}
function realtimeRoute(route = "", callback, v) {
    const isHsl = route.split(":")[0].toLowerCase() == "hsl"
    const client = mqtt.connect(isHsl ? "wss://mqtt.hsl.fi:443/" : "wss://mqtt.digitransit.fi:443/");
    client.on("connect", () => {
        client.subscribe(isHsl ? `/hfp/v2/journey/ongoing/+/+/+/+/${route.split(":")[1]/* number part */}/#` :
                       /* else */`/gtfsrt/vp/${route.split(":")[0]/* feed string part */}/+/+/+/${route.split(":")[1]/* number part */}/#`, (err) => {
            if (err) console.log("MQTT Error:", err)
            else console.log("Subscription succeeded to", isHsl ? "HSL" : "Digitransit")
        });
    });
    client.on("message", (topic, message) => {
        if (v != gen && !isPopupOpen) {
            client.end()
            vehicleLayer.clearLayers()
        }
        const parts = topic.split("/")
        callback(isHsl ? JSON.parse(message.toString()) : gtfsrt.decode(new Uint8Array(message)), parts, isHsl)
    });
}
function renderShapes(shapes) {
    shapes.forEach(p => {
        const polyline = renderPolyline(p.geometry, routeType(p.route.type).color, false, true)
        polyline.addTo(tempGroup)
        polyline.route = p.route
        polyline.bindTooltip("test", {
            sticky: true,
            interactive: true
        })
        polyline.on("mousemove", e => moveHandler(e, polyline))
        /* let latlons = []
        polyline._latlngs.forEach(latlon => {
            if (map.getBounds().contains(latlon)) latlons.push(latlon)
            else if (latlons.length > 0) return
        });
        polyline.bindTooltip(p.route.shortName, {
            sticky: true,
            permanent: true
        })
        polyline.on("mouseover", e => {
            polyline.openTooltip(e.latlng)
        })
        const latlon = latlons[Math.floor(latlons.length/2)]
        if (latlon) {
            const label = L.marker(latlon, {interactive: true,
                icon: L.divIcon({
                    className: 'label',
                    html: `<div height="20" style="width:${p.route.shortName.length * 8 + 8}px;background-color:${routeType(p.route.type).color};" class="route-name"><h1>${p.route.shortName}</h1></div>`
                })
            }).addTo(tempGroup)
        } */
    })
}
function renderCircle(stop = { lat: 0, lon: 0 }, color, transfer, draw = true) {
    //Radius of the circle rendered on the map
    let radius = 8
    //If transfer
    if (transfer == true) {
        //Larger radius if transfer
        radius = 10
    }
    //Adds a circle to the stop coords
    const marker = L.circleMarker([stop.lat, stop.lon],
        {
            radius: radius,
            color: color,
            fillColor: 'white',
            fillOpacity: 1,
            pane: 'transfermarkers'
        })
    if (draw) {
        marker.addTo(layerGroup)
    }
    return marker
}
function clearMap(all = true) {
    tempGroup.clearLayers();
    if (all) {
        layerGroup.clearLayers();
    }
}
function renderPolyline(shape, color, draw = true, interactive = false) {
    let latlngs = []
    for (let i = 0; i < shape.length / 2; i++) {
        //Reformat the latlongs
        const lat = shape[i];
        const lon = shape[i + shape.length / 2]
        //Check for bad latlon
        if (lat == undefined || lat == '' || lon == undefined || lon == '') {
        } else {
            const latlon = [lat, lon]
            latlngs.push(latlon)
        }

    }

    //Draw polyline
    const polyline = L.polyline(shape, {
        color: color,
        interactive: interactive,
        dashArray: color == 'gray' ? [2, 3] : null,
        renderer: canvasRenderer,
    })
    if (draw) {
        polyline.addTo(layerGroup);
    }
    return polyline

}
function routeType(code) {
    if (/.*,.*/.test(code)) code = code.split(",")[0]
    if (code instanceof String || typeof code == 'string') {
        code = code.toUpperCase()
    }
    switch (code) {
        case "TRAM":
        case 0:
            text = 'tram'
            color = 'green'
            importance = 13
            break;
        case 0:
        case "TRAM":
            text = 'tram'
            color = 'green'
            importance = 13
            break;
        case 1:
        case "SUBWAY":
        case "METRO":
            text = 'metro'
            color = 'red'
            importance = 12
            break;
        case 4:
        case "FERRY":
            text = 'ferry'
            color = 'teal'
            importance = 13
            break;
        case 109:
        case "RAIL":
        case "TRAIN":
            text = 'train'
            color = 'purple'
            importance = 9
            break;
        case 700:
        case 3:
        case 715:
        case "BUS":
            text = 'bus'
            color = 'blue'
            importance = 15
            break;
        case 701:
            text = 'regional bus'
            color = 'blue'
            importance = 15
            break;
        case 702:
            text = 'trunk bus'
            color = '#EA7000'
            importance = 13
            break;
        case 704:
        case 712:
            text = 'local bus'
            color = 'cyan'
            importance = 15
            break;
        case 900:
            text = 'lightrail'
            color = 'darkgreen'
            importance = 13
            break;
        case "WALK":
        case 2:
            text = 'walk'
            color = 'gray'
            importance = null
            break;
        case "WAIT":
            text = 'wait'
            color = 'gray'
            importance = null
            break;
        case 1104:
        case "AIRPLANE":
            text = 'airplane'
            color = 'darkblue'
            importance = 0
            break;
        case 102:
            text = 'intercity train'
            color = 'green'
            break;
        case '':
            text = 'none'
            color = 'white'
            importance = null
            break;
        default:
            //If not any code
            text = 'main'
            color = 'pink'
            importance = null
            console.trace('Unsupported vehicle type: ', code)
    }
    //Return the information
    return { text: text, color: color, importance: importance }
}
async function search(inputElement) {
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
    if (features.length < 1) {

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
    } else {
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
            type.style.backgroundImage = `url(img/icons/${getIcon(element.layer, element.addendum)}.svg)`

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
                map.flyTo([element.lat, element.lon], map.getZoom(), {duration: 0.5})
                stopTiles.redraw()
            })
            autocorrect.append(row)
        }
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
            "content-type" : "application/graphql"
        },
        body : query
    })
    const result = await rawdata.json()

    const clusters = result.data.stops.filter((value, index, self) =>
        index === self.findIndex((t) => (
          t.cluster.id === value.cluster.id
        ))
    )
    let results = clusters.map(c => c.cluster)
    results = results.concat(
        lines.length ? lines : result.data.routes.map(r => {r.name = r.shortName ? (r.agency.name == "Helsingin seudun liikenne" ? "HSL" : r.agency.name) + " " + r.shortName + " " + r.longName :  (r.agency.name == "Helsingin seudun liikenne" ? "HSL" : r.agency.name) + " " + r.longName; return r}),
        agencies.length ? agencies : result.data.agencies
    )
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
                banned[type].splice(i,1)
                banButton.querySelector("svg").setAttribute("stroke","red")
                banButton.style.background = "white"
            } else {
                banned[type].push(item.gtfsId)
                banButton.querySelector("svg").setAttribute("stroke","white")
                banButton.style.background = "red"
            }
        })
        const unPreferButton = document.createElement("button")
        unPreferButton.classList.add("button")
        unPreferButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="orange"> <path stroke-linecap="round" stroke-linejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54" /></svg>`
        unPreferButton.addEventListener("click", e => {
            const i = unpreferred[type].findIndex(e => e == item.gtfsId)
            if (i >= 0) {
                unpreferred[type].splice(i,1)
                unPreferButton.querySelector("svg").setAttribute("stroke","orange")
                unPreferButton.style.background = "white"
            } else {
                unpreferred[type].push(item.gtfsId)
                unPreferButton.querySelector("svg").setAttribute("stroke","white")
                unPreferButton.style.background = "orange"
            }
        })
        const preferButton = document.createElement("button")
        preferButton.classList.add("button")
        preferButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="green" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" /></svg>`
        preferButton.addEventListener("click", e => {
            const i = preferred[type].findIndex(e => e == item.gtfsId)
            if (i >= 0) {
                preferred[type].splice(i,1)
                preferButton.querySelector("svg").setAttribute("stroke","green")
                preferButton.style.background = "white"
            } else {
                preferred[type].push(item.gtfsId)
                preferButton.querySelector("svg").setAttribute("stroke","white")
                preferButton.style.background = "green"
            }
        })
        switch (type) {
            case "stops":
                if (banned[type].find(e => e == item.gtfsId)) {banButton.querySelector("svg").setAttribute("stroke","white");banButton.style.background = "red"}
                buttons.append(banButton)
                buttons.style.setProperty("--e",1)
                break;
            case "agencies":
            case "routes":
                if (banned[type].find(e => e == item.gtfsId)) {banButton.querySelector("svg").setAttribute("stroke","white");banButton.style.background = "red"}
                if (unpreferred[type].find(e => e == item.gtfsId)) {unPreferButton.querySelector("svg").setAttribute("stroke","white");unPreferButton.style.background = "red"}
                if (preferred[type].find(e => e == item.gtfsId)) {preferButton.querySelector("svg").setAttribute("stroke","white");preferButton.style.background = "red"}
                buttons.append(preferButton, unPreferButton, banButton)
                break;
            default:
                break;
        }
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
function preAPI() {
    document.getElementById('routes').innerHTML = ""
    autocorrect2.innerHTML = ''
    autocorrect1.innerHTML = ''
    console.log('Starting new route process\n\n\n\n')
    let input1
    let input2
    let error = ''
    if (inputIds[0]) {
        input1 = inputIds[0]
    } else {
        const searchResults = searchIndex.search(document.getElementById('input1').value)
        if (searchResults[0]) {
            input1 = searchResults[0].position
            setValue(searchResults[0].position, searchResults[0].name, 1)
            document.getElementById('error1').hidden = true
        } else {
            document.getElementById('error1').hidden = false
            error += 'origin '
        }
    }
    if (inputIds[1]) {
        input2 = inputIds[1]
    } else {
        const searchResults = searchIndex.search(document.getElementById('input2').value)
        if (searchResults[0]) {
            input2 = searchResults[0].position
            setValue(searchResults[0].position, searchResults[0].name, 2)
            document.getElementById('error2').hidden = true
        } else {
            document.getElementById('error2').hidden = false
            error += 'destination '
        }
    }
    input1 = JSON.stringify(input1)
    input2 = JSON.stringify(input2)
    const input3 = document.getElementById('input3').value
    const input4 = document.getElementById('input4').value
    values.time = input3
    values.date = input4
    if ((apiRunning == false && error == '') || random) {
        console.log('Getting route from ', input1, ' to ', input2, ' at ', input4, input3)
        api()
    } else if (apiRunning == true) {
        console.log('Route process terminated because previous process is not complete')
        setError({ message: "Please wait for the previous route process to finish" }, 5000)
    } else {
        console.log('Route process terminated beacuse the following input values were not valid:', error)
    }
}
async function api() {

    document.getElementById('rph').innerHTML = `Loading routes from ${values.from.display} to ${values.to.display}`
    document.getElementById('routes').innerHTML = loadingHTML2
    routes.length = 0
    //Prevents API from getting too many requests
    apiRunning = true


    //Fetch the data
    const data = await digitransitRoute()
    console.log('Request OK')
    //Finish JSON handling
    values.routes = data
    document.getElementById('routes').innerHTML = ""
    document.getElementById('rph').innerHTML = `Loaded ${data.data.plan.itineraries.length} routes from ${values.from.display ? values.from.display : "DEFAULT"} to ${values.to.display ? values.to.display : "DEFAULT"}`
    if (!random) {
        localStorage.setItem('route', JSON.stringify(values))
    }
    for (let i = 0; i < data.data.plan.itineraries.length; i++) {
        const r = data.data.plan.itineraries[i];
        routes.push(route(r, i))
        map.flyToBounds(routes[0].bbox, 0.3)
    }
    viewRoute(0, false)
    sidebarMode('routepreview')
    apiRunning = false

}
function sidebarMode(mode) {
    currentMode = mode
    switch (mode) {
        case 'main':
            stopImportanceOffset = 0
            clearMap()
            for (let i = 0; i < sb1.length; i++) {
                const element = sb1.item(i)
                element.hidden = false
            }
            for (let i = 0; i < sb2.length; i++) {
                const element = sb2.item(i)
                element.hidden = true
            }
            for (let i = 0; i < sb3.length; i++) {
                const element = sb3.item(i)
                element.hidden = true
            }
            maincontent.style.gridTemplateAreas =
                `"text1 input1 input1 map map"
            "text2 input2 input2 map map"
            "text3 weekday input3 map map"
            "search search search map map"
            "options options options map map"`
            break;
        case 'routepreview':
            stopImportanceOffset = 3
            clearMap()
            for (let i = 0; i < sb1.length; i++) {
                const element = sb1.item(i)
                element.hidden = true
            }
            for (let i = 0; i < sb3.length; i++) {
                const element = sb3.item(i)
                element.hidden = true
            }
            for (let i = 0; i < sb2.length; i++) {
                const element = sb2.item(i)
                element.hidden = false
            }
            maincontent.style.gridTemplateAreas =
                `"back rph rph map map"
            "routes routes routes map map"
            "routes routes routes map map"
            "routes routes routes map map"
            "routes routes routes map map"`
            break;
        case 'route':
            stopImportanceOffset = 3
            for (let i = 0; i < sb1.length; i++) {
                const element = sb1.item(i)
                element.hidden = true
            }
            for (let i = 0; i < sb2.length; i++) {
                const element = sb2.item(i)
                element.hidden = true
            }
            for (let i = 0; i < sb3.length; i++) {
                const element = sb3.item(i)
                element.hidden = false
            }
            maincontent.style.gridTemplateAreas =
                `"back rh rh rh map"
            "route route route route map"
            "route route route route map"
            "route route route route map"
            "route route route route map"`
            break;

        default:
            break;
    }
}
function route(route, i) {
    clearMap()
    let routeHTML = '<table border="0" cellspacing="0" cellpadding="0">'

    let routepreview = '<span class="preview">'
    let trips = []
    let previousTrip
    const dateInUnix = new Date().setHours(0, 0, 0, 0) / 1000

    for (let i = 0; i < route.legs.length; i++) {
        const leg = route.legs[i]
        if ((leg.route ? leg.route.type : leg.mode) == "WALK") {
            let start_time = new Date(leg.start.scheduledTime)
            const startTime = start_time.getHours() * 3600 + start_time.getMinutes() * 60 + start_time.getSeconds()
            const end_time = new Date(leg.end.scheduledTime)
            const endTime = end_time.getHours() * 3600 + end_time.getMinutes() * 60 + end_time.getSeconds()
            leg.startTime = startTime
            leg.endTime = endTime
            const walktime = endTime - startTime
            const color = routeType("WALK").color

            routepreview += walktime > 30 ? `<span class="preview-cell" style="width:${100 / route.duration * walktime - 1}%;background-color:${color}">${image.walk(15)}</span>` : ''
            if (i == 0) {
                const img1 = `background-image:url("img/startmarker.svg"),url("img/route/startgray.png")`
                const img2 = `background-image:url("img/route/gray.png")`
                routeHTML +=
                    `<tr><td class = "td">${sToTime(startTime)}</td>
                <td class="td" id="img" style=${img1}></td>
                <td class="td">${values.from.display}</td>
                </tr><tr>
                <td class="td"></td>
                <td class="td" id="img" style=${img2}></td>
                <td class="td">walk ${sToHMinS(walktime)}</td>`
            } else if (i == route.legs.length - 1) {
                const img1 = `background-image:url("img/endmarker.svg"),url("img/route/endgray.png")`
                const img2 = `background-image:url("img/route/gray.png")`

                routeHTML +=
                    `<tr><td></td>
                    <td class="td" id="img" style=${img2}></td>
                    <td>walk ${sToHMinS(walktime)}</td>
                    </tr><tr>
                    <td>${sToTime(endTime)}</td>
                    <td class="td" id="img" style=${img1}></td>
                    <td>${values.to.display}</td>
                    </tr>`
            } else {
                const img1 = `background-image:url("img/route/gray.png")`

                routeHTML +=
                    `<tr><td class="td"></td>
                <td id="img" style=${img1}></td>
                <td class="td">walk ${sToHMinS(walktime)}</td></tr>`
            }
            trips.push({
                tripStart: null,
                routeId: null,
                id: null,
                routeType: "WALK",
                color: color,
                fromCoords: { lat: leg.from.lat, lon: leg.from.lon },
                toCoords: { lat: leg.to.lat, lon: leg.to.lon },
                shape: leg.legGeometry.points,
                popUpTime: walktime,
                popUpType: "WALK",
                startTime: sToTime(startTime),
                endTime: sToTime(endTime),
            })

        } /* transit */ else {
            let start_time = new Date(leg.start.estimated ? leg.start.estimated.time : leg.start.scheduledTime)
            const startTime = start_time.getHours() * 3600 + start_time.getMinutes() * 60 + start_time.getSeconds()
            const end_time = new Date(leg.end.estimated ? leg.end.estimated.time : leg.end.scheduledTime)
            const endTime = end_time.getHours() * 3600 + end_time.getMinutes() * 60 + end_time.getSeconds()
            leg.startTime = startTime
            leg.endTime = endTime
            const duration = endTime - startTime
            const waittime = startTime - previousTrip.endTime
            let color = routeType(leg.route.type).color
            if(color == '#EA7000') color = 'orange'
            routepreview += `<span class="preview-cell" style="width:${100 / route.duration * duration - 1}%;background-color:${color}">${leg.route.shortName}</span>`
            if (i == 0) {

            } else {
                
                const img1 = `background-image:url("img/route/start${color}.png")`
                const img2 = `background-image:url("img/route/${color}.png")`
                const img3 = `background-image:url("img/route/end${color}.png")`
                const img5 = `background-image:url("img/route/grey.png")`

                routeHTML +=
                    `${waittime > 0 ? `<tr><td></td>
                <td class="td" id="img" style=${img5}></td>
                <td class="td">wait ${sToHMinS(waittime)}</td>
                </tr>` : ""}<tr>
                <td class="top_td">${sToTime(startTime)}\n${routeType(leg.route.type).text}</td>
                <td class="border_td" id="img" style=${img1}></td>
                <td class="top_td">${leg.from.stop.name} ${leg.from.stop.code ? leg.from.stop.code : ""}</td>
                </tr><tr>
                <td class="td"></td>
                <td class="td" id="img" style=${img2}></td>
                <td class="td">${leg.route.shortName} ${leg.trip.tripHeadsign.length < 25 ? leg.trip.tripHeadsign : `${leg.trip.tripHeadsign.slice(0, 25)}...`}</td>
                </tr><tr>
                <td class="bottom_td">${sToTime(endTime)}</td>
                <td class="border_td" id="img" style=${img3}></td>
                <td class="bottom_td">${leg.to.stop.name} ${leg.to.stop.code ? leg.to.stop.code : ""}</td></tr>`
            }
            console.log(sToTime(leg.trip.departureStoptime.scheduledDeparture))
            trips.push({
                tripStart: leg.trip.departureStoptime.scheduledDeparture,
                routeId: leg.route.gtfsId,
                direction: parseInt(leg.trip.directionId),
                id: leg.trip.gtfsId,
                routeType: leg.mode,
                color: color,
                fromCoords: { lat: leg.from.lat, lon: leg.from.lon },
                toCoords: { lat: leg.to.lat, lon: leg.to.lon },
                shape: leg.legGeometry.points,
                popUpTime: waittime,
                popUpType: "WAIT",
                routeName: leg.route.shortName || leg.route.longName,
                startTime: sToTime(startTime),
                endTime: sToTime(endTime),
            })
        }
        previousTrip = leg
    }

    const bbox = [trips[0].fromCoords, trips[trips.length - 1].toCoords]
    routeHTML += '</table>'
    routepreview += '</span>'
    const table = document.createElement('table')
    table.classList.add('route-preview')
    let fare = ""
    if (route.fares.length != 0) {
        fare = route.fares.cents / 100
    }
    table.innerHTML = `
        <tr>
        <td>${trips[0].startTime} - ${trips[trips.length - 1].endTime}</td>
        <td></td>
        <td>${route.duration >= 3600 ? `${Math.floor(route.duration / 3600)}h ` : ''}${Math.floor(route.duration % 3600 / 60)}min</td>
        </tr><tr>
        <td>${fare}</td>
        <td></td>
        <td>${image.walk(15)} ${route.walkDistance >= 1000 ? `${Math.round(route.walkDistance / 10) / 100}km` : `${Math.round(route.walkDistance)}m`}</td>
        </tr><tr>
        <td colspan="3">${routepreview}</td>
        </tr>
    `
    table.addEventListener('mouseover', e => eval(`viewRoute(${i},false)`))
    table.addEventListener('click', e => eval(`viewRoute(${i},true)`))
    document.getElementById('routes').append(table)
    return { html: routeHTML, bbox: bbox, trips: trips, duration: route.duration, walk_distance: route.walkDistance, fares: fare }
    for (let i = 0; i < route.legs.length; i++) {
        const trip = route.legs[i];
        if (trip.route == null) {
            trip.route = ''
            trip.route.shortName = ''
            trip.trip = ''
            trip.trip.tripHeadsign = 'Walk to destination'
        }
        let nextTrip
        if (i < route.legs.length - 1) {
            nextTrip = route.legs[i + 1]
        } else {
            nextTrip = "NONE"
        }
        const tripInfo = routeType(trip.mode)
        console.log(`trip start ${trip.startTime} end ${trip.endTime} next start ${nextTrip.startTime}`)
        trip.startTime = trip.startTime / 1000
        trip.endTime = trip.endTime / 1000
        let duration = (nextTrip == "NONE" ? trip.endTime - trip.startTime : nextTrip.startTime / 1000 - trip.startTime)
        console.log(`duration ${duration}`)
        //Start
        if (i == 0) {
            if /* Walking */(trip.mode == "WALK") {
                const walktime = trip.endTime - trip.startTime
                transfers.push({ wait: duration - walktime, walk: walktime })
                routepreview += walktime > 10 ? `<span class="preview-cell" style="width:${100 / route.duration[0] * walktime - 1}%;background-color:${tripInfo.color}">${image.walk(15)}</span>` : ''
                routepreview += duration - walktime > 10 ? `<span class="preview-cell" style="width:${100 / route.duration[0] * (duration - walktime) - 1}%;background-color:${tripInfo.color}">${image.wait(15)}</span>` : ''
                const img1 = `background-image:url("img/startmarker.svg"),url("img/route/start${tripInfo.color}.png")`
                const img2 = `background-image:url("img/route/${tripInfo.color}.png")`
                routeHTML +=
                    `<tr><td>${trip.endTime}</td>
                <td id="img" style=${img1}></td>
                <td>Origin</td>
                </tr><tr>
                <td></td>
                <td id="img" style=${img2}></td>
                <td>walk ${sToHMinS(walktime)}${duration - walktime ? `, wait ${sToHMinS(duration - walktime)}` : ''}</td></tr>`

            } else {
                transfers.push(false)
                routepreview += `<span class="preview-cell" style="width:${100 / route.duration[0] * duration - 1}%;background-color:${tripInfo.color}">${trip.route_name}</span>`
                const img1 = `background-image:url("img/route/start${tripInfo.color}.png")`
                const img2 = `background-image:url("img/route/${tripInfo.color}.png")`
                routeHTML +=
                    `<tr><td>${trip.endTime}</td>
                <td id="img" style=${img1}></td>
                <td>${trip.from.stop.name} ${trip.from.stop.code}</td>
                </tr><tr>
                <td></td>
                <td id="img" style=${img2}></td>
                <td>${trip.route.shortName} ${trip.tripHeadsign}</td></tr>`
            }
        } else /* End */ if (i == route.legs.length - 1) {
            //Route
            const img = `background-image:url('img/endmarker.svg'),url('img/route/end${tripInfo.color}.png')`
            routeHTML +=
                `<tr><td>${trip.endTime}</td>
            <td id="img" style="${img}"></td>
            <td>Destination</tr>`
        } else /* Transfer */if (trip.trip.gtfsId != previousTrip.trip.gtfsId) {
            /* Walking transfer 1st*/if (trip.mode == "WALK") {
                const walktime = trip.endTime - trip.startTime
                routepreview += walktime > 10 ? `<span class="preview-cell" style="width:${100 / route.duration[0] * walktime - 1}%;background-color:${tripInfo.color}">${image.walk(15)}</span>` : ''
                routepreview += duration - walktime > 10 ? `<span class="preview-cell" style="width:${100 / route.duration[0] * (duration - walktime) - 1}%;background-color:${tripInfo.color}">${image.wait(15)}</span>` : ''
                transfers.push({ wait: duration - walktime, walk: walktime })
                const img1 = `background-image:url("img/route/end${previousTripInfo.color}.png"),url("img/route/start${tripInfo.color}.png")`
                const img2 = `background-image:url("img/route/${tripInfo.color}.png")`
                routeHTML +=
                    `<tr><td>${trip.endTime}</td>
                <td id="img" style=${img1}></td>
                <td>${trip.route.shortName} ${trip.trip.tripHeadsign}</td>
                </tr><tr>
                <td></td>
                <td id="img" style=${img2}></td>
                <td>walk ${sToHMinS(walktime)}${duration - walktime ? `, wait ${sToHMinS(duration - walktime)}` : ''}</td></tr>`
            }/* Same stop transfer */ else if (previousTrip.route_type != "WALK") {
                routepreview += `<span class="preview-cell" style="width:${100 / route.duration[0] * (hhmmssToS(trip.endTime) - hhmmssToS(previousTrip.endTime)) - 1}%;background-color:gray">${image.wait(15)}</span>`
                routepreview += `<span class="preview-cell" style="width:${100 / route.duration[0] * duration - 1}%;background-color:${tripInfo.color}">${trip.route.shortName}</span>`
                transfers.push({ wait: duration, walk: false })
                routeName = ``
                const img1 = `background-image:url("img/route/end${previousTripInfo.color}.png"),url("img/route/startgrey.png")`
                const img2 = `background-image:url("img/route/grey.png")`
                const img3 = `background-image:url("img/route/endgrey.png"),url("img/route/start${tripInfo.color}.png")`
                const img4 = `background-image:url("img/route/${tripInfo.color}.png")`
                routeHTML +=
                    `<tr><td>${previousTrip.endTime}</td>
                <td id="img" style=${img1}></td>
                <td>${previousTrip.to.stop.name} ${previousTrip.to.stop.code}</td>
                </tr><tr>
                <td></td>
                <td id="img" style=${img2}></td>
                <td>wait ${sToHMinS(hhmmssToS(trip.endTime) - hhmmssToS(previousTrip.endTime))}</td>
                </tr><tr>
                <td>${trip.startTime}</td>
                <td id="img" style=${img3}></td>
                <td>${trip.from.stop.name} ${trip.from.stop.code}</td>
                </tr><tr>
                <td></td>
                <td id="img" style=${img4}></td>
                <td><span class="depRoute" style="background-color:${tripInfo.color}">${trip.route.shortName}</span> ${trip.trip.tripHeadsign} (${sToHMinS(duration)})</td>
                </tr>`
            } /* Walking transfer 2nd half */else {
                routepreview += `<span class="preview-cell" style="width:${100 / route.duration[0] * duration - 1}%;background-color:${tripInfo.color}">${trip.route.shortName}</span>`
                transfers.push(false)
                routeName = `<span class="depRoute" style="background-color:${tripInfo.color}">${trip.route.shortName}</span> `
                const img1 = `background-image:url("img/route/end${previousTripInfo.color}.png"),url("img/route/start${tripInfo.color}.png")`
                const img2 = `background-image:url("img/route/${tripInfo.color}.png")`
                routeHTML +=
                    `<tr><td>${trip.endTime}</td>
                <td id="img" style=${img1}></td>
                <td>${trip.from.stop.name} ${trip.from.stop.code}</td>
                </tr><tr>
                <td></td>
                <td id="img" style=${img2}></td>
                <td><span class="depRoute" style="background-color:${tripInfo.color}">${trip.route.shortName}</span> ${trip.trip.tripHeadsign} (${sToHMinS(duration)})</td></tr>`
            }
            nonTransfers = []
        } else {
            nonTransfers.push(trip)
            transfers.push(false)
        }
        colors.push(tripInfo.color)
        previousTrip = trip
        previousTripInfo = tripInfo
    }
}
function setValue(lat, lon, display, field) {
    if (field == 1) {
        values.from = { lat: lat, lon: lon, display: display }
        autocorrect1.hidden = true
        //inputIds[0] = value
        document.getElementById('input1').value = display
    } else if (field == 2) {
        values.to = { lat: lat, lon: lon, display: display }
        autocorrect2.hidden = true
        //inputIds[1] = value
        document.getElementById('input2').value = display
    }
}
function getPreviousRoute() {
    const popup = document.getElementById('popup')
    let popupC = ''
    let buttons = `<button id="ok" onclick="document.getElementById('popup').style.left = '-50%';setTimeout(() => {document.getElementById('popup').style.display = 'none'},1000)">Cancel</button>`
    buttons += '<button id="ok" onclick="loadPreviousRoute()">OK</button>'
    if (localStorage.getItem('route')) {
        const data = JSON.parse(localStorage.getItem('route'))
        popupC = 'Load saved route from '
        popupC += data.from.display
        popupC += ' to '
        popupC += data.to.display
        popupC += ' at '
        popupC += data.time
        popupC += ' '
        popupC += data.date
        popupC += ' ?<br>'
        popupC += buttons
        popup.innerHTML = popupC
        popup.style.left = '0'
        popup.addEventListener('mouseover', () => {
            if (popup.style.left != '-50%') {
                popup.style.left = '0'
                if (!popup.timoutActive) {
                    popup.timoutActive = setTimeout(function () {
                        popup.timoutActive = false

                        popup.style.left = '-27%'
                    }, 4000)
                }
            }
        })
        popup.timoutActive = true
        setTimeout(function () {
            popup.timoutActive = false
            popup.style.left = '-27%'
        }, 10000)
    }
}
function loadPreviousRoute() {
    const popup = document.getElementById('popup')
    document.getElementById('routes').innerHTML = ""
    routes.length = 0
    popup.style.left = '-50%'
    setTimeout(() => {
        popup.style.display = 'none'
    }, 1000)
    sidebarMode('routepreview')
    const data = JSON.parse(localStorage.getItem('route'))
    setValue(data.from.value, data.from.display, 1)
    setValue(data.to.value, data.to.display, 2)
    document.getElementById('input3').value = data.time
    document.getElementById('input4').value = data.date
    document.getElementById('rph').innerHTML = `Loaded ${data.routes.length} routes from ${data.from.display} to ${data.to.display}`
    for (let i = 0; i < data.routes.length; i++) {
        const r = data.routes[i];
        routes.push(route(r, i))
    }
    map.flyToBounds(routes[0].bbox, 0.3)
    viewRoute(0, false)
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
function popup(open, stop) {
    if (open) {
        isPopupOpen = true
        stopPopup.style.top = `${500}px`
        stopPopup.style.height = `${window.innerHeight - 500}px`
        stopPopupC.innerHTML = `<h3>${stop.code} ${stop.text}</h3><table><tr><td class="stop-routes">${stop.labels}</td></tr><tr><td><button onclick="setValue(${JSON.stringify(stop.position)},'${stop.name}',1)">Set as origin</button><button onclick="setValue(${JSON.stringify(stop.position)},'${stop.name}',2)">Set as destination</button></td></tr></table><div class="loading"><h4>Loading departures</h4>${loadingHTML}</div>`
    } else {
        gen++
        isPopupOpen = false
        stopPopup.style.top = '100%'
        stopPopup.style.height = '0px'
    }
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
function hhmmssToS(text) {
    const parsed = String(text).match(/^(?<hours>\d+):(?<minutes>\d+):(?<seconds>\d+)$/);
    if (parsed !== null) {
        const hours = parseInt(parsed.groups.hours, 10);
        const minutes = parseInt(parsed.groups.minutes, 10);
        const seconds = parseInt(parsed.groups.seconds, 10);
        const totalSeconds = 3600 * hours + 60 * minutes + seconds;
        return totalSeconds
    }
}
function sToHMinS(seconds) {
    return `${seconds >= 3600 ? `${Math.floor(seconds / 3600)}h ` : ''}${Math.floor(seconds % 3600 / 60)}min ${seconds % 60 ? `${seconds % 60}s` : ''}`
}
function sToTime(seconds) {
    if (seconds > 24 * 3600) seconds -= 24 * 3600
    return `${Math.floor(seconds / 3600)}:${padNumber(Math.floor(seconds % 3600 / 60))}${seconds % 60 ? `:${padNumber(seconds % 60)}` : ''}`
}
class realtimeHandler{
    constructor(url, query, returnFormat, callback) {
        this.callback = callback
        this.returnFormat = returnFormat
        this.client =  mqtt.connect(url)
        this.client.on("connect", () => {
            this.client.subscribe(query, (err) => {
                if (err) console.log("MQTT Error:", err)
                else console.log("Subscription succeeded to", url)
            });
        })
        this.client.on("message", (topic, message) => {
            switch (this.returnFormat) {
                case "JSON":
                    this.callback(JSON.parse(message.toString()), topic.split("/"))
                    break
                case "GTFSRT":
                    this.callback(gtfsrt.decode(new Uint8Array(message)), topic.split("/"))
                    break
                default:
                    this.callback(message, topic)
                    break
            }
        });
    } 
    end() {
        this.client.end()
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
                        if (isHsl) {
                            const id = topic[7] + topic[8]
                            const values = Object.values(data)[0]
                            const pV = vehicles.find(e => id == e.id)
                            if (!values.lat || !values.long) return
                            if (!pV) {
                                const marker = L.marker([values.lat,values.long], {
                                    pane: "vehiclePane",
                                    icon: L.divIcon({
                                        html: image.vehicle(25, routeType(topic[6]).color, values.hdg, values.desi),
                                        iconSize: [25,25],
                                        className: "vehicle-marker"
                                    })
                                })
                                vehicles.push({data: values, marker: marker, id: id})
                                marker.addTo(vehicleLayer)
                            } else {
                                pV.data = values
                                pV.marker.setLatLng([values.lat,values.long])
                            }
                        } else /* Digitransit */ {
                            console.log(data, topic)
                            const id = topic[10]
                            const pV = vehicles.find(e => id == e.id)
                            const veh = data.entity[0].vehicle
                            const pos = {lat: veh.position.latitude, lon: veh.position.longitude}

                            if (!pos.lat || !pos.lon) return
                            if (!pV) {
                                console.log(topic[20].length ? topic[20] : routeType(topic[6]).color, topic[19])
                                const marker = L.marker([pos.lat,pos.lon], {
                                    pane: "vehiclePane",
                                    icon: L.divIcon({
                                        html: image.vehicle(25, topic[20].length ? topic[20] : routeType(topic[6]).color, 0, topic[19]),
                                        iconSize: [25,25],
                                        className: "vehicle-marker"
                                    })
                                })
                                vehicles.push({data: data, marker: marker, id: id})
                                marker.addTo(vehicleLayer)
                            } else {
                                pV.data = data
                                pV.marker.setLatLng([pos.lat,pos.lon])
                            }
                        }
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
        if (trip.routeType != "WALK") {
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
function parseHTML(string) {
    const div = document.createElement("div")
    div.innerHTML = string
    return div.children
}
function polylineIntersects(latlons, bbox) {
    for (let i = 1; i < latlons.length; i++) {
        if (L.polyline([latlons[i - 1], latlons[i]]).getBounds().intersects(bbox)) return true
    }
    return false
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
        const name = r.shortName || routeType(r.gtfsType).text
        if (lines.find(e => { return (e.name == name && e.color == routeType(r.type).color && e.headsign == r.headsign) })) return
        lines.push({ headsign: r.headsign, name: name, color: routeType(r.type).color, o: r })
        labels += `<span height="20" style="width:${name ? name.length * 8 + 8 : routeType(r.gtfsType).text.length * 8 + 8}px;border-color:${routeType(r.type).color};background-color:${routeType(r.type).color};" class="route-label"><h1>${name}</h1></span>`
    })
    labels += `</div>`
    polyline.openTooltip(e.latlng).setTooltipContent(labels)
}
function routeTypeToSortValue(routeType) {
    if (routeType == 102) return 110
    if (routeType == 702) return 699
    return routeType
}
function preferencesToOptions(obj) {
    let opt = ""
    Object.keys(obj).forEach(key => {if (obj[key].length) opt += `${key}:"${obj[key].toString()}",`})
    return opt
}
async function digitransitRoute() {

    let param = ""
    parameters.forEach(p => {
        param += ` ${p.graphqlName}:${p.value},`
    })
    console.log(param)
    clearMap()
    const query = `{
  plan(
    from: {lat: ${values.from.lat }, lon: ${values.from.lon}}
    to: {lat: ${values.to.lat}, lon: ${values.to.lon}}
    date: "${document.getElementById('input4').value}",
    time: "${document.getElementById('input3').value}",
    ${param},
    banned: {${preferencesToOptions(banned)}}
    preferred: {${preferencesToOptions(preferred)}}
    unpreferred: {${preferencesToOptions(unpreferred)}}
  ) {
    itineraries {
      duration
      fares {
        type
        currency
        cents
      }
      walkDistance
      startTime
      endTime
      legs {
        start {
          scheduledTime
          estimated {
            time
            delay
          }
        }
        end {
          scheduledTime
          estimated {
            time
            delay
          }
        }
        mode
        duration
        realTime
        realtimeState
        distance
        transitLeg
        from {
          lat
          lon
          stop {
            code
            name
          }
        }
        to {
          lat
          lon
          stop {
            code
            name
          }
        }
        trip {
          departureStoptime{
            scheduledDeparture
          }
          directionId
          gtfsId
          tripHeadsign
        }
        route {
          shortName
          longName
          type
          gtfsId
        }
        legGeometry {
          length  
          points
        }
      }
    }
  }
}`
    const rawdata = await fetch("https://api.digitransit.fi/routing/v2/routers/finland/index/graphql?digitransit-subscription-key=a1e437f79628464c9ea8d542db6f6e94", { "credentials": "omit", "headers": { "Content-Type": "application/graphql", }, "body": query, "method": "POST", });
    const result = await rawdata.json()
    if(result.errors){
        setError({ code: (rawdata ? rawdata.status : ''), message: (result ? result.errors[0].message : 'Route could not be fetched') }, 10000)
    }
    return result
}

// v1 query
/*`{
  plan(
    from: {lat: ${fromLat}, lon: ${fromLon}}
    to: {lat: ${toLat}, lon: ${toLon}}
    date: "${document.getElementById('input4').value}",
    time: "${document.getElementById('input3').value}",
  ) {
    itineraries {
      duration
      fares {
        type
        currency
        cents
      }
      walkDistance
      startTime
      endTime
      legs {
        startTime
        endTime
        departureDelay
        arrivalDelay
        mode
        duration
        realTime
        realtimeState
        distance
        transitLeg
        from {
          lat
          lon
          stop {
            code
            name
          }
        }
        to {
          lat
          lon
          stop {
            code
            name
          }
        }
        trip {
          gtfsId
          tripHeadsign
        }
        route {
          shortName
          type
        }
        legGeometry {
          length  
          points
        }
      }
    }
  }
}`*/
function addParameters(data) {
    data.forEach(p => {
        parameters.push(
            new SearchParameter(p)
        )
    })
    const container = document.getElementById("options")
    parameters.forEach(p => {
        container.appendChild(p.element)
    })
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
        this.id = encodeURIComponent(this.label.replaceAll(" ","").toLowerCase())
        this.element = this.#createElements()
    }
    #createElements(){
        const container = document.createElement("div")
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
            input.addEventListener("change", function() {
                let v = parseInt(this.value);
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
    get value(){
        const input = this.element.querySelector("input")
        switch (this.type) {
            case "number":
                return parseInt(input.value)
            case "checkbox":
                return input.checked
            default:
                return input.value
        }
    }
}