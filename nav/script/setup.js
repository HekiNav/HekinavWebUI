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
                for (let i = deps.length - 1; i > -1; i--) {
                    if (deps[i].realtimeArrival < date - 60 && deps[i].serviceDate == new Date().setHours(0, 0, 0, 0)) {
                        console.log(`removing ${i}`)
                        deps.splice(i, 1);
                    }
                }
                if (data.data.stop.stoptimesWithoutPatterns.length > 0) {
                    clearMap()
                    renderShapes(data.data.stop.patterns)
 
                    data.data.stop.routes.forEach(r => {
                        realtime(r.gtfsId, (data, topic, isHsl) => {
                            if (isHsl) {
                                const id = topic[7] + topic[8]
                                const values = Object.values(data)[0]
                                const pV = vehicles.find(e => id == e.id)
                                if (!values.lat || !values.long) return
                                if (!pV) {
                                    const marker = L.marker([values.lat,values.long], {
                                        pane: "vehiclePane",
                                        icon: L.divIcon({
                                            html: image.vehicle(20, routeType(topic[6]).color, values.hdg, values.desi),
                                            iconSize: [20,20],
                                            className: "vehicle-marker"
                                        })
                                    })
                                    vehicles.push({data: values, marker: marker, id: id})
                                    marker.addTo(vehicleLayer)
                                } else {
                                    pV.data = values
                                    pV.marker.setLatLng([values.lat,values.long])
                                }
                            } else {
    
                            }
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

                    deps.sort((a, b) => a.realtimeArrival - b.realtimeArrival)
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
                        if (diff >= -60) {
                            popupText += `<tr>${platforms ? `<td class="center">${dep.stop.platformCode}</td>` : ''}
                                    <td><span class="depRoute"style="background-color:${routeType(dep.trip.route.type).color}">${dep.trip.route.shortName || dep.trip.route.longName}</span>&nbsp${dep.headsign || dep.trip.tripHeadsign}</td>
                                    <td class="center time${i} ${dep.status}">${sToTime(dep.realtimeArrival)}</td><td class="center">${sToTime(dep.scheduledArrival)}</td>
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
function realtime(route = "", callback, v) {
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
        if (v != gen) {
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
            fillOpacity: 1
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
        renderer: canvasRenderer
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
    let text
    let color
    let importance
    if (code == 0 || code == "TRAM") {
        text = 'tram'
        color = 'green'
        importance = 13
    } else if (code == 1 || code == "SUBWAY" || code == "METRO") {
        text = 'metro'
        color = 'red'
        importance = 12
    } else if (code == 4 || code == "FERRY") {
        text = 'ferry'
        color = 'teal'
        importance = 13
    } else if (code == 109 || code == "RAIL" || code == "TRAIN") {
        text = 'train'
        color = 'purple'
        importance = 9
    } else if (code == 700 || code == 3 || code == 715 || code == "BUS") {
        text = 'bus'
        color = 'blue'
        importance = 15
    } else if (code == 701) {
        text = 'regional bus'
        color = 'blue'
        importance = 15
    } else if (code == 702) {
        text = 'trunk bus'
        color = '#EA7000'
        importance = 13
    } else if (code == 704 || code == 712) {
        text = 'local bus'
        color = 'cyan'
        importance = 15
    } else if (code == 900) {
        text = 'lightrail'
        color = 'darkgreen'
        importance = 13
    } else if (code == 2) {
        text = 'walk'
        color = 'gray'
        importance = null
    } else if (code == 1104 || code == "AIRPLANE") {
        text = 'airplane'
        color = 'darkblue'
        importance = 0
    } else if (code == 102) {
        text = 'intercity train'
        color = 'green'
    } else if (code == '') {
        text = 'none'
        color = 'white'
        importance = null
    } else {
        //If not any code
        text = 'main'
        color = 'pink'
        console.trace('Unsupported vehicle type: ', code)
    }
    //Return the information
    return { text: text, color: color, importance: importance }
}
function search(inputElement) {
    const input = document.getElementById('input' + inputElement).value
    const searchResults = searchIndex.search(input)
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
    if (searchResults.length < 1) {

        const header = document.createElement('div')
        header.classList.add('stopRow')

        const h3 = document.createElement('h3')
        h3.textContent = 'Recent searches'
        header.append(h3)
        autocorrect.append(header)

        const row = document.createElement('div')
        row.classList.add('stopRow')

        const code = document.createElement('div')
        code.classList.add('stopCode')
        code.textContent = 'Code'

        const city = document.createElement('div')
        city.classList.add('stopCity')
        city.textContent = 'City'

        const text = document.createElement('div')
        text.classList.add('stopText')
        text.textContent = 'Name(type)'

        row.append(code)
        row.append(city)
        row.append(text)
        autocorrect.append(row)

        for (let i = 0; i < recentSearches.length && i < 100; i++) {
            const element = recentSearches[i];
            /* element.city = element.city.replaceAll('ae','ä')
            element.city = element.city.replaceAll('oe','ö') */

            const row = document.createElement('div')
            row.classList.add('stopRow')

            const code = document.createElement('div')
            code.classList.add('stopCode')
            code.textContent = element.code

            const city = document.createElement('div')
            city.classList.add('stopCity')
            city.textContent = element.city

            const text = document.createElement('div')
            text.classList.add('stopText')
            text.textContent = element.text

            row.append(code)
            row.append(city)
            row.append(text)
            row.addEventListener('click', e => {
                setValue(element.position, element.name, inputElement);
            })
            autocorrect.append(row)
        }
    } else {
        const row = document.createElement('div')
        row.classList.add('stopRow')

        const code = document.createElement('div')
        code.classList.add('stopCode')
        code.textContent = 'Code'

        const city = document.createElement('div')
        city.classList.add('stopCity')
        city.textContent = 'City'

        const text = document.createElement('div')
        text.classList.add('stopText')
        text.textContent = 'Name(type)'

        row.append(code)
        row.append(city)
        row.append(text)
        autocorrect.append(row)
        for (let i = 0; i < searchResults.length && i < 100; i++) {
            const element = searchResults[i];
            /* element.city = element.city.replaceAll('ae','ä')
            element.city = element.city.replaceAll('oe','ö') */

            const row = document.createElement('div')
            row.classList.add('stopRow')

            const code = document.createElement('div')
            code.classList.add('stopCode')
            code.textContent = element.code

            const city = document.createElement('div')
            city.classList.add('stopCity')
            city.textContent = element.city

            const text = document.createElement('div')
            text.classList.add('stopText')
            text.textContent = element.text

            row.append(code)
            row.append(city)
            row.append(text)
            row.addEventListener('click', e => {
                setValue(element.position, element.name, inputElement);
                recentSearches.add(element)
            })
            autocorrect.append(row)
        }
    }

}
async function getStops() {
    document.querySelector('body').style.cursor = 'wait'
    let localData = await fetch('/nav/data/stops.htv')
    let localData2 = await fetch('/nav/data/stops2.htv')
    loadStops(await localData.json(), await localData2.json())
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
    setMarkerSizes(stopGroup)
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
        api(input1, input2, input3, input4)
        sidebarMode('routepreview')
    } else if (apiRunning == true) {
        console.log('Route process terminated because previous process is not complete')
        setError({ message: "Please wait for the previous route process to finish" }, 5000)
    } else {
        console.log('Route process terminated beacuse the following input values were not valid:', error)
    }
}
async function api(from, to, time, day) {
    document.getElementById('rph').innerHTML = `Loading routes from ${values.from.display} to ${values.to.display}`
    document.getElementById('routes').innerHTML = loadingHTML2
    routes.length = 0
    //Prevents API from getting too many requests
    apiRunning = true
    //Generate fetching address
    let address
    if (random) {
        address = `${domain}/route?from=random&to=random&time=random&nroutes=5`
    } else {
        address = `${domain}/route?from=${from}&to=${to}&time=${time}&date=${day}&nroutes=10`
    }
    //Fetch the data
    try {
        console.log('Requesting route with url: ', address)
        const sendDate = (new Date()).getTime();
        var rawdata = await fetch(address, {
            headers: {
                "Access-Control-Allow-Origin": "*",
            }
        })
        console.log('Request OK')
        const rawtext = await rawdata.text()
        //Json handling
        let data = await JSON.parse(rawtext);
        const time = new Date().getTime() - sendDate
        //Error handling
        if (data.error) {
            sidebarMode('main')
            setError({ code: rawdata.status, message: data.message }, 30000)
        }
        else {
            //Finish JSON handling
            values.routes = data
            document.getElementById('routes').innerHTML = ""
            document.getElementById('rph').innerHTML = `Loaded ${data.length} routes from ${values.from.display} to ${values.to.display} in ${time > 1000 ? `${Math.round(time / 10) / 100}s` : `${time}ms`}`
            if (!random) {
                localStorage.setItem('route', JSON.stringify(values))
            }
            for (let i = 0; i < data.length; i++) {
                const r = data[i];
                console.log('Raw JSON route data: ', r)
                routes.push(route(r, i))
                map.flyToBounds(routes[0].bbox, 0.3)
                viewRoute(i, false)
            }
        }
        apiRunning = false
        if (repeat == true) {
            setTimeout(preAPI(), 10000)
        }
    } catch (error) {
        sidebarMode('main')
        //Log the error
        if (rawdata) {
            setError(error, 30000)
        } else {
            setError({ message: 'Could not connect to the Hekinav Routing Services' }, 10000)
        }
        apiRunning = false
    }

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
            stopImportanceOffset = 0
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
            stopImportanceOffset = 4
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
function route(json, i) {
    clearMap()
    let routeHTML = '<table border="0" cellspacing="0" cellpadding="0">'
    let colors = []
    let transfers = []
    let nonTransfers = []
    let nextTransfer = {}
    let previousTrip = { route_id: 0, stop_id: 0 }
    let previousTripInfo = {}
    let routepreview = '<span class="preview">'
    for (let i = 0; i < json.trips.length; i++) {
        const trip = json.trips[i];
        if (trip.route_name == undefined) {
            trip.route_name = ''
            trip.trip_name = 'Walk to destination'
        }
        let nextTrip
        if (i < json.trips.length - 1) {
            nextTrip = json.trips[i + 1]
            for (let j = i + 1; j < json.trips.length + 1; j++) {
                const pTrip = json.trips[j - 1] ? json.trips[j - 1] : { trip_id: "1" }
                const trip = json.trips[j] ? json.trips[j] : { trip_id: "a", arrival_time: pTrip.arrival_time };
                if ((trip.trip_id != pTrip.trip_id)) {
                    nextTransfer = trip
                    break
                }

            }
        } else {
            nextTrip = { route_id: 0, stop_id: 0 }
            nextTransfer = json.trips[json.trips.length - 1]
        }
        const tripInfo = routeType(trip.route_type)
        const duration = hhmmssToS(nextTransfer.arrival_time) - hhmmssToS(trip.arrival_time)
        //Start
        if (i == 0) {
            if /* Walking */(trip.route_type == 2) {
                const walktime = hhmmssToS(nextTrip.arrival_time) - hhmmssToS(trip.arrival_time)
                transfers.push({ wait: duration - walktime, walk: walktime })
                routepreview += walktime > 10 ? `<span class="preview-cell" style="width:${100 / json.duration[0] * walktime - 1}%;background-color:${tripInfo.color}">${image.walk(15)}</span>` : ''
                routepreview += duration - walktime > 10 ? `<span class="preview-cell" style="width:${100 / json.duration[0] * (duration - walktime) - 1}%;background-color:${tripInfo.color}">${image.wait(15)}</span>` : ''
                const img1 = `background-image:url("img/startmarker.svg"),url("img/route/start${tripInfo.color}.png")`
                const img2 = `background-image:url("img/route/${tripInfo.color}.png")`
                routeHTML +=
                    `<tr><td>${trip.arrival_time}</td>
                <td id="img" style=${img1}></td>
                <td>Origin</td>
                </tr><tr>
                <td></td>
                <td id="img" style=${img2}></td>
                <td>walk ${sToHMinS(walktime)}${duration - walktime ? `, wait ${sToHMinS(duration - walktime)}` : ''}</td></tr>`

            } else {
                transfers.push(false)
                routepreview += `<span class="preview-cell" style="width:${100 / json.duration[0] * duration - 1}%;background-color:${tripInfo.color}">${trip.route_name}</span>`
                const img1 = `background-image:url("img/route/start${tripInfo.color}.png")`
                const img2 = `background-image:url("img/route/${tripInfo.color}.png")`
                routeHTML +=
                    `<tr><td>${trip.arrival_time}</td>
                <td id="img" style=${img1}></td>
                <td>${trip.stop_name} ${trip.stop_code}</td>
                </tr><tr>
                <td></td>
                <td id="img" style=${img2}></td>
                <td>${trip.route_name} ${trip.trip_name}</td></tr>`
            }
        } else /* End */ if (i == json.trips.length - 1) {
            //Route
            const img = `background-image:url('img/endmarker.svg'),url('img/route/end${tripInfo.color}.png')`
            routeHTML +=
                `<tr><td>${trip.arrival_time}</td>
            <td id="img" style="${img}"></td>
            <td>Destination</tr>`
        } else /* Transfer */if (trip.trip_id != previousTrip.trip_id) {
            /* Walking transfer 1st*/if (trip.route_type == 2) {
                const walktime = hhmmssToS(nextTrip.arrival_time) - hhmmssToS(trip.arrival_time)
                routepreview += walktime > 10 ? `<span class="preview-cell" style="width:${100 / json.duration[0] * walktime - 1}%;background-color:${tripInfo.color}">${image.walk(15)}</span>` : ''
                routepreview += duration - walktime > 10 ? `<span class="preview-cell" style="width:${100 / json.duration[0] * (duration - walktime) - 1}%;background-color:${tripInfo.color}">${image.wait(15)}</span>` : ''
                transfers.push({ wait: duration - walktime, walk: walktime })
                const img1 = `background-image:url("img/route/end${previousTripInfo.color}.png"),url("img/route/start${tripInfo.color}.png")`
                const img2 = `background-image:url("img/route/${tripInfo.color}.png")`
                routeHTML +=
                    `<tr><td>${trip.arrival_time}</td>
                <td id="img" style=${img1}></td>
                <td>${trip.stop_name} ${trip.stop_code}</td>
                </tr><tr>
                <td></td>
                <td id="img" style=${img2}></td>
                <td>walk ${sToHMinS(walktime)}${duration - walktime ? `, wait ${sToHMinS(duration - walktime)}` : ''}</td></tr>`
            }/* Same stop transfer */ else if (previousTrip.route_type != 2) {
                routepreview += `<span class="preview-cell" style="width:${100 / json.duration[0] * (hhmmssToS(trip.arrival_time) - hhmmssToS(previousTrip.arrival_time)) - 1}%;background-color:gray">${image.wait(15)}</span>`
                routepreview += `<span class="preview-cell" style="width:${100 / json.duration[0] * duration - 1}%;background-color:${tripInfo.color}">${trip.route_name}</span>`
                transfers.push({ wait: duration, walk: false })
                routeName = ``
                const img1 = `background-image:url("img/route/end${previousTripInfo.color}.png"),url("img/route/startgrey.png")`
                const img2 = `background-image:url("img/route/grey.png")`
                const img3 = `background-image:url("img/route/endgrey.png"),url("img/route/start${tripInfo.color}.png")`
                const img4 = `background-image:url("img/route/${tripInfo.color}.png")`
                routeHTML +=
                    `<tr><td>${previousTrip.arrival_time}</td>
                <td id="img" style=${img1}></td>
                <td>${previousTrip.stop_name} ${previousTrip.stop_code}</td>
                </tr><tr>
                <td></td>
                <td id="img" style=${img2}></td>
                <td>wait ${sToHMinS(hhmmssToS(trip.arrival_time) - hhmmssToS(previousTrip.arrival_time))}</td>
                </tr><tr>
                <td>${trip.arrival_time}</td>
                <td id="img" style=${img3}></td>
                <td>${trip.stop_name} ${trip.stop_code}</td>
                </tr><tr>
                <td></td>
                <td id="img" style=${img4}></td>
                <td><span class="depRoute" style="background-color:${tripInfo.color}">${trip.route_name}</span> ${trip.trip_name} (${sToHMinS(duration)})</td>
                </tr>`
            } /* Walking transfer 2nd half */else {
                routepreview += `<span class="preview-cell" style="width:${100 / json.duration[0] * duration - 1}%;background-color:${tripInfo.color}">${trip.route_name}</span>`
                transfers.push(false)
                routeName = `<span class="depRoute" style="background-color:${tripInfo.color}">${trip.route_name}</span> `
                const img1 = `background-image:url("img/route/end${previousTripInfo.color}.png"),url("img/route/start${tripInfo.color}.png")`
                const img2 = `background-image:url("img/route/${tripInfo.color}.png")`
                routeHTML +=
                    `<tr><td>${trip.arrival_time}</td>
                <td id="img" style=${img1}></td>
                <td>${trip.stop_name} ${trip.stop_code}</td>
                </tr><tr>
                <td></td>
                <td id="img" style=${img2}></td>
                <td><span class="depRoute" style="background-color:${tripInfo.color}">${trip.route_name}</span> ${trip.trip_name} (${sToHMinS(duration)})</td></tr>`
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
    routeHTML += '</table>'
    routepreview += '</span>'
    const place1 = json.trips[0]
    const place2 = json.trips[json.trips.length - 1]
    const bbox = [[place1.lat, place1.lon], [place2.lat, place2.lon]]
    const table = document.createElement('table')
    table.classList.add('route-preview')
    table.innerHTML = `
        <tr>
        <td>${place1.arrival_time} - ${place2.arrival_time}</td>
        <td></td>
        <td>${json.duration >= 3600 ? `${Math.floor(json.duration / 3600)}h ` : ''}${Math.floor(json.duration % 3600 / 60)}min</td>
        </tr><tr>
        <td>${json.fares.price[0]}€</td>
        <td></td>
        <td>${json.walk_distance >= 1000 ? `${Math.round(json.walk_distance / 10) / 100}km` : `${Math.round(json.walk_distance)}m`}</td>
        </tr><tr>
        <td colspan="3">${routepreview}</td>
        </tr>
    `
    table.addEventListener('mouseover', e => eval(`viewRoute(${i},false)`))
    table.addEventListener('click', e => eval(`viewRoute(${i},true)`))
    document.getElementById('routes').append(table)
    return { html: routeHTML, bbox: bbox, transfers: transfers, colors: colors, trips: json.trips, duration: json.duration, walk_distance: json.walk_distance, fares: json.fares }
}
function setValue(value, display, field) {
    if (field == 1) {
        values.from = { value: value, display: display }
        //autocorrect1.hidden = true
        inputIds[0] = value
        document.getElementById('input1').value = display
    } else if (field == 2) {
        values.to = { value: value, display: display }
        //autocorrect2.hidden = true
        inputIds[1] = value
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
function setMarkerSizes(LeafletGroup) {
    const zoom = map.getZoom()
    console.time('zoom')
    LeafletGroup.eachLayer((stop) => {
        if (zoom < stop.show + stopImportanceOffset && stop.onMap == true) {
            stop.onMap = false
            stop.removeFrom(map)
        } else if (zoom >= stop.show + stopImportanceOffset && stop.onMap == false) {
            stop.onMap = true
            stop.addTo(map)
            stop.setStyle({ radius: 2 })
            stop.bringToFront()
        }
    })
    console.timeEnd('zoom')
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
    console.log(seconds)
    return `${seconds >= 3600 ? `${Math.floor(seconds / 3600)}h ` : ''}${Math.floor(seconds % 3600 / 60)}min ${seconds % 60 ? `${seconds % 60}s` : ''}`
}
function sToTime(seconds) {
    if (seconds > 24 * 3600) seconds -= 24 * 3600
    return `${Math.floor(seconds / 3600)}:${padNumber(Math.floor(seconds % 3600 / 60))}${seconds % 60 ? `:${padNumber(seconds % 60)}` : ''}`
}
function viewRoute(i, click) {
    popup(false)
    const route = routes[i]
    clearMap()
    ///CLICK ONLY
    if (click) {
        document.getElementById('route').innerHTML = route.html
        sidebarMode('route')
        map.flyToBounds(route.bbox, 1)
    }//HOVER ONLY
    else {
        routes.forEach(r => {
            if (r != route) {
                for (let k = 0; k < r.trips.length; k++) {
                    const trip = r.trips[k];
                    renderPolyline(trip.shape, '#555')
                }
            }
        })
    }
    //BOTH
    for (let j = 0; j < route.trips.length; j++) {
        const isTransfer = route.transfers[j] ? true : false
        const trip = route.trips[j];
        //polyline
        const polyline = renderPolyline(trip.shape, route.colors[j])
        //Add route label
        if (trip.route_type != 2) {
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
                        html: `<div height="20" style="width:${trip.route_name.length * 8 + 8}px;background-color:${routeType(trip.route_type).color};" class="route-name"><h1>${trip.route_name}</h1></div>`
                    })
                }).addTo(tempGroup)
            }
        }
        //CLICK ONLY
        if ((j == 0 || j == route.trips.length - 1) && click) {
            //Add start and end markers
            L.marker({ lat: trip.lat, lon: trip.lon }, { icon: j == 0 ? greenIcon : redIcon }).addTo(layerGroup);
        }
        //Stops
        const marker = renderCircle({ lat: trip.lat, lon: trip.lon }, route.colors[j], isTransfer, true)
        if (isTransfer && (route.transfers[j].walk > 10 || route.transfers[j].wait > 10)) {
            //Add a popup to tell walking and waiting times
            const transfer = route.transfers[j]
            marker.bindTooltip(`${transfer.walk ? `${image.walk(12)}${sToHMinS(transfer.walk)}` : ''} ${transfer.wait ? `${image.wait(12)}${sToHMinS(transfer.wait)}` : ''}`, {
                opacity: 1.0,
                sticky: false,
                permanent: true
            }).openTooltip()
        } else if (click) {
            renderCircle({ lat: trip.lat, lon: trip.lon }, route.colors[j], false)
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
    if(routeType == 102) return 110
    if(routeType == 702) return 699
    return routeType
}