fetch("img/TRANSIT_MAP_2024_v72-OPTIMISED.svg").then(async e => {
    const htmlString = await e.text()
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    start(div.firstChild)
})
var zooming = false
var drag = false;
var offset = { x: 0, y: 0 };
var factor = .1;
var matrix = new DOMMatrix();

function start(svg) {
    var container = document.getElementById("around")
    container.appendChild(svg)
    var viewPort = document.getElementById("viewport")  

    svg.addEventListener('pointerdown', function (event) {
        event.preventDefault()
        drag = true;
        offset = { x: event.offsetX, y: event.offsetY };
    });
    svg.addEventListener('pointermove', function (event) {
        event.preventDefault()
        if (drag) {
            var tx = event.offsetX - offset.x;
            var ty = event.offsetY - offset.y;
            offset = {
                x: event.offsetX,
                y: event.offsetY
            };  
            matrix.preMultiplySelf(new DOMMatrix()
                .translateSelf(tx, ty));
            viewPort.style.transform = matrix.toString();
        }
    });
    svg.addEventListener('pointerup', function (event) {
        drag = false;
    });
    svg.addEventListener('wheel', function (event) {
        zooming = true
        var zoom = event.deltaY > 0 ? -1 : 1;
        var scale = 1 + factor * zoom;
        offset = {
            x: event.offsetX,
            y: event.offsetY
        };
        matrix.preMultiplySelf(new DOMMatrix()
            .translateSelf(offset.x, offset.y)
            .scaleSelf(scale, scale)
            .translateSelf(-offset.x, -offset.y));
        viewPort.style.transform = matrix.toString();
    });
    
}
