import SearchParameters from "../handlers/SearchParameters.js"
import SearchOptions from "../handlers/SearchParameters.js"

export default function getQuery() {
  const fromTo = SearchOptions.getFromTo
  console.log(fromTo)
  switch (document.getElementById("apiSelect").value) {
    case "hslv1":
    case "finlandv1":
      let options = ""
      /*for (let i = 0; i < parameters.length; i++) {
        p = parameters[i]
        if (p.graphqlCategory1 == "option") {
          options += ` ${p.graphqlName}:${p.value},`
          continue
        }
      }*/

      modeString = ""
      /*modes.forEach(mode => {
        modeString += `{mode: ${mode}},`
      })*/

      return `{
  plan(
    from: {lat: ${values.from.lat}, lon: ${values.from.lon}}
    to: {lat: ${values.to.lat}, lon: ${values.to.lon}}
    date: "${document.getElementById('input4').value}",
    time: "${document.getElementById('input3').value}",
    transportModes: [{mode: WALK}, {mode: BUS}, {mode: RAIL}${modeString}]
    ${options}
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
          departureStoptime {
            scheduledDeparture
          }
        }
        route {
          shortName
          gtfsId
          type
        }
        legGeometry {
          length  
          points
        }
      }
    }
  }
}`
    case "hslv2":
    case "finlandv2":
      let option = ""
      let pref = {}
      let via = {}
      /*for (let i = 0; i < parameters.length; i++) {
        p = parameters[i]
        if (p.graphqlCategory1 == "option") {
          option += ` ${p.graphqlName}:${p.value},`
          continue
        }
        if (p.graphqlCategory1 == "via") {
          if (!Object.keys(via).includes(p.graphqlCategory2)) {
            via[p.graphqlCategory2] = {}
          }
          if (!Object.keys(via[p.graphqlCategory2]).includes(p.graphqlName)) {
            console.log(p.value)
            via[p.graphqlCategory2][p.graphqlName] = p.graphqlName == "minimumWaitTime" ? `§PT${p.value}s§` : p.value
          }
          continue
        }

        if (!Object.keys(pref).includes(p.graphqlCategory2)) {
          pref[p.graphqlCategory2] = {}
        }
        if (!Object.keys(pref[p.graphqlCategory2]).includes(p.graphqlCategory3)) {
          pref[p.graphqlCategory2][p.graphqlCategory3] = {}
        }
        pref[p.graphqlCategory2][p.graphqlCategory3][p.graphqlName] = p.value
      }

      if (viaStop.id != "" && viaStop.type == "via") {
        if (!via.passThrough) via.passThrough = {}
        via.passThrough.stopLocationIds = [`§${viaStop.id}§`]
        delete via['visit']
      }
      else if (viaStop.id != "" && viaStop.type == "visit") {
        if (!via.visit) via.visit = {}
        via.visit.stopLocationIds = [`§${viaStop.id}§`]
      }
      else {
        //cuz one of the params implements itself even if theres no viastop
        delete via['visit']
      }*/

      //modeString = ""
      /*modes.forEach(mode => {
        modeString += `{mode: ${mode}},`
      })*/

      //remove quotes for graphql
      pref = JSON.stringify(pref).replaceAll(/"/g, "")
      via = JSON.stringify(via).replaceAll(/"/g, "").replaceAll(/§/g, '"')
  //readd prefs: preferences: ${pref}
  //viastop ${viaStop.id != "" ? `via: ${via}` : ""}
      return `{
  planConnection(
    origin: {location: {coordinate: {latitude: ${fromTo[0][0]}, longitude: ${fromTo[0][1]}}}}
    destination: {location: {coordinate: {latitude: ${fromTo[1][0]}, longitude: ${fromTo[1][1]}}}}
    dateTime: {earliestDeparture: "${SearchParameters.date}T${SearchParameters.time}+02:00"}
    ${option}
    modes: {transit: {transit: [{mode: BUS}, {mode: RAIL}]}}
  ) {
    pageInfo {
      endCursor
    }
    edges {
      node {
        start
        end
        duration
        walkDistance
        legs {
          mode
          realTime
          realtimeState
          duration
          start {
            estimated {
              delay
              time
            }
            scheduledTime
          }
          end {
            estimated {
              delay
              time
            }
            scheduledTime
          }
          from {
            lat
            lon
            stop {
              name
              code
            }
          }
          to {
            lat
            lon
            stop {
              name
              code
            }
          }
          trip {
            tripHeadsign
            departureStoptime {
              scheduledDeparture
            }
          }
          route {
              shortName
              longName
              type
              agency {
                name
                url
              }
            }
          legGeometry {
            length
            points
          }
        }
      }
    }
  }
}`
  }
}