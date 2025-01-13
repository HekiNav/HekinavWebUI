export default class DepartureView {
    constructor(stop) {
        this.stop = stop
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
            const query = `{\"query\":\"{  stop(id: \\\"${stop.gtfsId}\\\") {patterns{route{type shortName}geometry{lat lon}} name code lat lon alerts {route{shortName}}stoptimesWithoutPatterns(numberOfDepartures: 100) {stop {platformCode} serviceDay headsign scheduledArrival scheduledDeparture realtimeState realtimeArrival realtimeDeparture trip { tripHeadsign route { type gtfsId  longName     shortName        }      }      headsign    }  }}\"}`
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
                        vehicles.length = 0
                        vehicleLayer.clearLayers()
                        mqttInstances.forEach(i => i.end())
                        deps.forEach(d => {
                            const id = d.trip.route.gtfsId
                            const isHsl = id.split(":")[0].toLowerCase() == "hsl"
                            mqttInstances.push(
                                new realtimeHandler(
                                    isHsl ? "wss://mqtt.hsl.fi:443/" : "wss://mqtt.digitransit.fi:443/",
                                    isHsl ? `/hfp/v2/journey/ongoing/+/+/+/+/${id.split(":")[1]/* number part */}/#` :
                            /* digitransit */`/gtfsrt/vp/${id.split(":")[0]/* feed string part */}/+/+/+/${id.split(":")[1]/* number part */}/#`,
                                    isHsl ? "JSON" : "GTFSRT",
                                    (data, topic) => {
                                        renderVehicle(isHsl, data, topic)
                                    }
                                )
                            )
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
                                        <td><span class="depRoute"style="background-color:${Util.routeType(dep.trip.route.type).color}">${dep.trip.route.shortName || dep.trip.route.longName}</span>&nbsp${dep.headsign || dep.trip.tripHeadsign}</td>
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
}