export default class Endpoint {
    static apiName() {
        return document.getElementById("apiSelect").value
    }

    static apiUrl() {
        switch (document.getElementById("apiSelect").value) {
            case "hslv2":
                return "v2/hsl/gtfs/v1"
            case "finlandv2":
                return "v2/finland/gtfs/v1"
            case "hslv1":
                return "v2/hsl/gtfs/v1"
            case "finlandv1":
                return "v2/hsl/gtfs/v1"
        }
    }
}