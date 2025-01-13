export default function addZones(json) {
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