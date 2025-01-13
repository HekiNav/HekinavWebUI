import setSidebarMode from "./setSidebar.js"
import getQuery from "./getQuery.js"
import Endpoint from "./Endpoint.js"

export default async function getRoutes() {
    document.getElementById('routes').innerHTML = ""
    document.getElementById("autocorrect1").innerHTML = ''
    document.getElementById("autocorrect2").innerHTML = ''
    console.log('Starting new route process\n\n\n\n')
    //document.getElementById('rph').innerHTML = `Loading routes from ${values.from.display} to ${values.to.display}`
    setSidebarMode('routepreview')
    //loading
    document.getElementById('routes').innerHTML = '<div class="lds-ring"><div></div><div></div><div></div><div></div></div>'

    //if (values.from.display == "" && document.getElementById('input1').value.length > 1) search(1, false)
    //if (values.to.display == "" && document.getElementById('input2').value.length > 1) search(2, false)
    //Fetch the data
    const data = await getDigitransitRoute()
    console.log('Request OK')
    //Finish JSON handling
    document.getElementById('routes').innerHTML = ""
    console.log(data)
    /*if (!random) {
        localStorage.setItem('route', JSON.stringify(values))
    }*/
    const endpoint = Endpoint.apiName()
    console.log(data)
    if (endpoint == "hslv2" || endpoint == "finlandv2") {
        //document.getElementById('rph').innerHTML = `Loaded ${data.data.planConnection.edges.length} routes from ${values.from.display ? values.from.display : "DEFAULT"} to ${values.to.display ? values.to.display : "DEFAULT"}`
        for (let i = 0; i < data.data.planConnection.edges.length; i++) {
            const r = data.data.planConnection.edges[i];
            routes.push(v2Route(r, i, data.data.planConnection.edges))
            map.flyToBounds(routes[0].bbox, 0.3)
        }
    }
    else {
        //document.getElementById('rph').innerHTML = `Loaded ${data.data.plan.itineraries.length} routes from ${values.from.display ? values.from.display : "DEFAULT"} to ${values.to.display ? values.to.display : "DEFAULT"}`
        for (let i = 0; i < data.data.plan.itineraries.length; i++) {
            const r = data.data.plan.itineraries[i];
            routes.push(v1Route(r, i, data.data.plan.itineraries))
            map.flyToBounds(routes[0].bbox, 0.3)
        }
    }

    viewRoute(0, false)
}

async function getDigitransitRoute() {
    const query = getQuery()
    const rawdata = await fetch(`https://api.digitransit.fi/routing/${Endpoint.apiUrl()}?digitransit-subscription-key=a1e437f79628464c9ea8d542db6f6e94`, { "credentials": "omit", "headers": { "Content-Type": "application/graphql", }, "body": query, "method": "POST", });
    const result = await rawdata.json()
    if (result.errors) {
        //setError({ code: (rawdata ? rawdata.status : ''), message: (result ? result.errors[0].message : 'Route could not be fetched') }, 10000)
        console.error("ROUTE REQUEST IS BAD")
    }
    return result
}

function viewRoute(i, click, routes) {
    //popup(false)
    const route = routes[i]
    //clearMap()
    ///CLICK ONLY
    if (click) {
        console.log("CLICK")
        document.getElementById('route').innerHTML = route.html
        setSidebarMode('route')
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

function v2Route(route, i) {
    clearMap()
    route = route.node
    console.log(route)
    console.log(route)
    let routeHTML = '<table border="0" cellspacing="0" cellpadding="0">'

    let routepreview = '<span class="preview">'
    let trips = []
    let previousTrip

    for (let i = 0; i < route.legs.length; i++) {
        const leg = route.legs[i]

        let start_time = new Date(leg.start.estimated ? leg.start.estimated.time : leg.start.scheduledTime)
        const startTime = start_time.getHours() * 3600 + start_time.getMinutes() * 60 + start_time.getSeconds()
        const end_time = new Date(leg.end.estimated ? leg.end.estimated.time : leg.end.scheduledTime)
        const endTime = end_time.getHours() * 3600 + end_time.getMinutes() * 60 + end_time.getSeconds()
        leg.startTime = startTime
        leg.endTime = endTime
        if ((leg.route ? leg.route.type : leg.mode) == "WALK") {
            const color = Util.routeType("WALK").color
            routepreview += leg.duration > 30 ? `<span class="preview-cell" style="width:${100 / route.duration * leg.duration - 1}%;background-color:${color}">${image.walk(15)}</span>` : ''
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
                <td class="td">walk ${sToHMinS(leg.duration)}</td>`
            } else if (i == route.legs.length - 1) {
                const img1 = `background-image:url("img/endmarker.svg"),url("img/route/endgray.png")`
                const img2 = `background-image:url("img/route/gray.png")`

                routeHTML +=
                    `<tr><td></td>
                    <td class="td" id="img" style=${img2}></td>
                    <td>walk ${sToHMinS(leg.duration)}</td>
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
                <td class="td">walk ${sToHMinS(leg.duration)}</td></tr>`
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
                popUpTime: leg.duration,
                popUpType: "WALK",
                startTime: sToTime(startTime),
                endTime: sToTime(endTime),
            })

        } /* transit */ else {
            const waittime = startTime - previousTrip.endTime
            let color = Util.routeType(leg.route.type).color
            if (color == '#EA7000') color = 'orange'
            routepreview += `<span class="preview-cell" style="width:${100 / route.duration * leg.duration - 1}%;background-color:${color}">${leg.route.shortName}</span>`
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
                <td class="top_td">${sToTime(startTime)}\n${Util.routeType(leg.route.type).text}</td>
                <td class="border_td" id="img" style=${img1}></td>
                <td class="top_td">${leg.from.stop.name} ${leg.from.stop.code ? leg.from.stop.code : ""}</td>
                </tr><tr>
                <td class="td"></td>
                <td class="td" id="img" style=${img2}></td>
                <td class="td">${leg.route.shortName} ${leg.trip.tripHeadsign ? (`${leg.trip.tripHeadsign.slice(0, 25)} ${leg.trip.tripHeadsign.length > 25 ? '...' : ''}`) : ""}</td>
                </tr><tr>
                <td class="bottom_td">${sToTime(endTime)}</td>
                <td class="border_td" id="img" style=${img3}></td>
                <td class="bottom_td">${leg.to.stop.name} ${leg.to.stop.code ? leg.to.stop.code : ""}</td></tr>`
            }
            //console.log(sToTime(leg.trip.departureStoptime.scheduledDeparture))
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
    /*let fare = ""
    if (route.fares.length != 0) {
        fare = route.fares.cents / 100
    }*/
    table.innerHTML = `
        <tr>
        <td>${trips[0].startTime} - ${trips[trips.length - 1].endTime}</td>
        <td></td>
        <td>${route.duration >= 3600 ? `${Math.floor(route.duration / 3600)}h ` : ''}${Math.floor(route.duration % 3600 / 60)}min</td>
        <td></td>
        <td>${image.walk(15)} ${route.walkDistance >= 1000 ? `${Math.round(route.walkDistance / 10) / 100}km` : `${Math.round(route.walkDistance)}m`}</td>
        </tr><tr>
        <td colspan="3">${routepreview}</td>
        </tr>
    `
    table.addEventListener('mouseover', e => eval(`viewRoute(${i},false)`))
    table.addEventListener('click', e => eval(`viewRoute(${i},true)`))
    document.getElementById('routes').append(table)
    return { html: routeHTML, bbox: bbox, trips: trips, duration: route.duration, walk_distance: route.walkDistance }
}

function v1Route(route, i) {
    clearMap()
    console.log(route)
    let routeHTML = '<table border="0" cellspacing="0" cellpadding="0">'

    let routepreview = '<span class="preview">'
    let trips = []
    let previousTrip
    const dateInUnix = new Date(document.getElementById("input4").value).setHours(0, 0, 0, 0) / 1000
    console.log(dateInUnix)

    for (let i = 0; i < route.legs.length; i++) {
        const leg = route.legs[i]
        //change date formatting from unix timestamp to seconds
        leg.startTime = leg.startTime / 1000 - dateInUnix
        leg.endTime = leg.endTime / 1000 - dateInUnix
        if ((leg.route ? leg.route.type : leg.mode) == "WALK") {
            const color = routeType("WALK").color
            routepreview += leg.duration > 30 ? `<span class="preview-cell" style="width:${100 / route.duration * leg.duration - 1}%;background-color:${color}">${image.walk(15)}</span>` : ''
            if (i == 0) {
                const img1 = `background-image:url("img/startmarker.svg"),url("img/route/startgray.png")`
                const img2 = `background-image:url("img/route/gray.png")`
                routeHTML +=
                    `<tr><td class = "td">${sToTime(leg.startTime)}</td>
                <td class="td" id="img" style=${img1}></td>
                <td class="td">${values.from.display}</td>
                </tr><tr>
                <td class="td"></td>
                <td class="td" id="img" style=${img2}></td>
                <td class="td">walk ${sToHMinS(leg.duration)}</td>`
            } else if (i == route.legs.length - 1) {
                const img1 = `background-image:url("img/endmarker.svg"),url("img/route/endgray.png")`
                const img2 = `background-image:url("img/route/gray.png")`

                routeHTML +=
                    `<tr><td></td>
                    <td class="td" id="img" style=${img2}></td>
                    <td>walk ${sToHMinS(leg.duration)}</td>
                    </tr><tr>
                    <td>${sToTime(leg.endTime)}</td>
                    <td class="td" id="img" style=${img1}></td>
                    <td>${values.to.display}</td>
                    </tr>`
            } else {
                const img1 = `background-image:url("img/route/gray.png")`

                routeHTML +=
                    `<tr><td class="td"></td>
                <td id="img" style=${img1}></td>
                <td class="td">walk ${sToHMinS(leg.duration)}</td></tr>`
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
                popUpTime: leg.duration,
                popUpType: "WALK",
                startTime: sToTime(leg.startTime),
                endTime: sToTime(leg.endTime),
            })

        } /* transit */ else {
            const waittime = leg.startTime - previousTrip.endTime
            let color = routeType(leg.route.type).color
            if (color == '#EA7000') color = 'orange'
            routepreview += `<span class="preview-cell" style="width:${100 / route.duration * leg.duration - 1}%;background-color:${color}">${leg.route.shortName}</span>`
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
                <td class="top_td">${sToTime(leg.startTime)}\n${routeType(leg.route.type).text}</td>
                <td class="border_td" id="img" style=${img1}></td>
                <td class="top_td">${leg.from.stop.name} ${leg.from.stop.code ? leg.from.stop.code : ""}</td>
                </tr><tr>
                <td class="td"></td>
                <td class="td" id="img" style=${img2}></td>
                <td class="td">${leg.route.shortName} ${leg.trip.tripHeadsign ? (`${leg.trip.tripHeadsign.slice(0, 25)} ${leg.trip.tripHeadsign.length > 25 ? '...' : ''}`) : ""}</td>
                </tr><tr>
                <td class="bottom_td">${sToTime(leg.endTime)}</td>
                <td class="border_td" id="img" style=${img3}></td>
                <td class="bottom_td">${leg.to.stop.name} ${leg.to.stop.code ? leg.to.stop.code : ""}</td></tr>`
            }
            //console.log(sToTime(leg.trip.departureStoptime.scheduledDeparture))
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
                startTime: sToTime(leg.startTime),
                endTime: sToTime(leg.endTime),
            })
        }
        previousTrip = leg
    }

    const bbox = [trips[0].fromCoords, trips[trips.length - 1].toCoords]
    routeHTML += '</table>'
    routepreview += '</span>'
    const table = document.createElement('table')
    table.classList.add('route-preview')
    /*let fare = ""
    if (route.fares.length != 0) {
        fare = route.fares.cents / 100
    }*/
    table.innerHTML = `
        <tr>
        <td>${trips[0].startTime} - ${trips[trips.length - 1].endTime}</td>
        <td></td>
        <td>${route.duration >= 3600 ? `${Math.floor(route.duration / 3600)}h ` : ''}${Math.floor(route.duration % 3600 / 60)}min</td>
        <td></td>
        <td>${image.walk(15)} ${route.walkDistance >= 1000 ? `${Math.round(route.walkDistance / 10) / 100}km` : `${Math.round(route.walkDistance)}m`}</td>
        </tr><tr>
        <td colspan="3">${routepreview}</td>
        </tr>
    `
    table.addEventListener('mouseover', e => eval(`viewRoute(${i},false)`))
    table.addEventListener('click', e => eval(`viewRoute(${i},true)`))
    document.getElementById('routes').append(table)
    return { html: routeHTML, bbox: bbox, trips: trips, duration: route.duration, walk_distance: route.walkDistance }
}