export default class mapRenderer{
    
function renderShapes(shapes) {
    shapes.forEach(p => {
        const polyline = renderPolyline(p.geometry, Util.routeType(p.route.type).color, false, true)
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
                    html: `<div height="20" style="width:${p.route.shortName.length * 8 + 8}px;background-color:${Util.routeType(p.route.type).color};" class="route-name"><h1>${p.route.shortName}</h1></div>`
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
}