export default class Itineraries {
    constructor() {
        this.routes = []
    }
    
    getPreviousRoute() {
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
    loadPreviousRoute() {
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
}