import mapRenderer from "./MapRenderer.js"

export default function setSidebarMode(mode) {
    const sb1 = document.getElementsByClassName("sb1")
    const sb2 = document.getElementsByClassName("sb2")
    const sb3 = document.getElementsByClassName("sb3")
    switch (mode) {
        case 'main':
            /*const map = new mapRenderer
            map.clearMap()*/
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
            //clearMap()
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