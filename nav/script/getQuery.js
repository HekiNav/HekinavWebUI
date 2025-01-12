function getQuery() {

  switch (document.getElementById("apiSelect").value) {
    case "v1/routers/hsl":
      return ""
    case "v1/routers/finland":
      return ""
    case "hslv2":
    case "finlandv2":
      let option = ""
      let pref = {}
      let via = {}
      for (let i = 0; i < parameters.length; i++) {
        p = parameters[i]
        if (p.graphqlCategory1 == "option") {
          option += ` ${p.graphqlName}:${p.value},`
          continue
        }
        if(p.graphqlCategory1 == "via") {
          if(!Object.keys(via).includes(p.graphqlCategory2)){
            via[p.graphqlCategory2] = {}
          }
          if(!Object.keys(via[p.graphqlCategory2]).includes(p.graphqlName)){
            console.log(p.value)
            via[p.graphqlCategory2][p.graphqlName] = p.graphqlName == "minimumWaitTime" ? `§PT${p.value}s§` : p.value
          }
          continue
        }

        if(!Object.keys(pref).includes(p.graphqlCategory2)){
          pref[p.graphqlCategory2] = {}
        }
        if(!Object.keys(pref[p.graphqlCategory2]).includes(p.graphqlCategory3)){
          pref[p.graphqlCategory2][p.graphqlCategory3] = {}
        }
        pref[p.graphqlCategory2][p.graphqlCategory3][p.graphqlName] = p.value
      }

      if(viaStop.id != "" && viaStop.type == "via"){
        if(!via.passThrough) via.passThrough = {}
        via.passThrough.stopLocationIds = [`§${viaStop.id}§`]
        delete via['visit']
      }
      else if(viaStop.id != "" && viaStop.type == "visit"){
        if(!via.visit) via.visit = {}
        via.visit.stopLocationIds = [`§${viaStop.id}§`]
      }
      else {
        //cuz one of the params implements itself even if theres no viastop
        delete via['visit']
      }

      modeString = ""
      modes.forEach(mode => {
        modeString += `{mode: ${mode}},`
      })

      //remove quotes for graphql
      pref = JSON.stringify(pref).replaceAll(/"/g, "")
      console.log(via)
      epic = via
      via = JSON.stringify(via).replaceAll(/"/g, "").replaceAll(/§/g, '"')

      return `{
  planConnection(
    origin: {location: {coordinate: {latitude: ${values.from.lat}, longitude: ${values.from.lon}}}}
    destination: {location: {coordinate: {latitude: ${values.to.lat}, longitude: ${values.to.lon}}}}
    dateTime: {earliestDeparture: "${document.getElementById("input4").value}T${document.getElementById("input3").value}+02:00"}
    preferences: ${pref}
    ${option}
    ${viaStop.id != "" ? `via: ${via}` : ""}
    modes: {transit: {transit: [${modeString}]}}
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