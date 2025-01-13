export default class Util {
    static sToHMinS(seconds) {
        return `${seconds >= 3600 ? `${Math.floor(seconds / 3600)}h ` : ''}${Math.floor(seconds % 3600 / 60)}min ${seconds % 60 ? `${seconds % 60}s` : ''}`
    }
    static sToTime(seconds) {
        if (seconds > 24 * 3600) seconds -= 24 * 3600
        return `${Math.floor(seconds / 3600)}:${padNumber(Math.floor(seconds % 3600 / 60))}${seconds % 60 ? `:${padNumber(seconds % 60)}` : ''}`
    }
    static parseHTML(string) {
        const div = document.createElement("div")
        div.innerHTML = string
        return div.children
    }
    static polylineIntersects(latlons, bbox) {
        for (let i = 1; i < latlons.length; i++) {
            if (L.polyline([latlons[i - 1], latlons[i]]).getBounds().intersects(bbox)) return true
        }
        return false
    }
    static hhmmssToS(text) {
        const parsed = String(text).match(/^(?<hours>\d+):(?<minutes>\d+):(?<seconds>\d+)$/);
        if (parsed !== null) {
            const hours = parseInt(parsed.groups.hours, 10);
            const minutes = parseInt(parsed.groups.minutes, 10);
            const seconds = parseInt(parsed.groups.seconds, 10);
            const totalSeconds = 3600 * hours + 60 * minutes + seconds;
            return totalSeconds
        }
    }
    static routeTypeToSortValue(routeType) {
        //other types are fine at the number they are just these ones should be changed a bit
        if (routeType == 102) return 110
        if (routeType == 702) return 699
        return routeType
    }
    static preferencesToOptions(obj) {
        let opt = ""
        Object.keys(obj).forEach(key => { if (obj[key].length) opt += `${key}:"${obj[key].toString()}",` })
        return opt
    }
    static routeType(code) {
        let text, color, importance
        if (/.*,.*/.test(code)) code = code.split(",")[0]
        if (code instanceof String || typeof code == 'string') {
            code = code.toUpperCase()
        }
        switch (code) {
            case "TRAM":
            case 0:
                text = 'tram'
                color = 'green'
                importance = 13
                break;
            case 0:
            case "TRAM":
                text = 'tram'
                color = 'green'
                importance = 13
                break;
            case 1:
            case "SUBWAY":
            case "METRO":
                text = 'metro'
                color = 'red'
                importance = 12
                break;
            case 4:
            case "FERRY":
                text = 'ferry'
                color = 'teal'
                importance = 13
                break;
            case 109:
            case "RAIL":
            case "TRAIN":
                text = 'train'
                color = 'purple'
                importance = 9
                break;
            case 700:
            case 3:
            case 715:
            case "BUS":
                text = 'bus'
                color = 'blue'
                importance = 15
                break;
            case 701:
                text = 'regional bus'
                color = 'blue'
                importance = 15
                break;
            case 702:
                text = 'trunk bus'
                color = '#EA7000'
                importance = 13
                break;
            case 704:
            case 712:
                text = 'local bus'
                color = 'cyan'
                importance = 15
                break;
            case 900:
                text = 'lightrail'
                color = 'darkgreen'
                importance = 13
                break;
            case "WALK":
            case 2:
                text = 'walk'
                color = 'gray'
                importance = null
                break;
            case "WAIT":
                text = 'wait'
                color = 'gray'
                importance = null
                break;
            case 1104:
            case "AIRPLANE":
                text = 'airplane'
                color = 'darkblue'
                importance = 0
                break;
            case 102:
                text = 'intercity train'
                color = 'green'
                break;
            case '':
                text = 'none'
                color = 'white'
                importance = null
                break;
            default:
                //If not any code
                text = 'main'
                color = 'pink'
                importance = null
                console.trace('Unsupported vehicle type: ', code)
        }
        //Return the information
        return { text: text, color: color, importance: importance }
    }
    static padNumber(d) {
        return (d < 10) ? '0' + d.toString() : d.toString();
    }
}