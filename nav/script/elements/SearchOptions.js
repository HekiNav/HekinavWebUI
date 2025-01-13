import JsonImport from "../handlers/JsonImport.js"
import SearchParameter from "../models/SearchParameter.js"

export default class SearchOptions {
    constructor() {
        this.data
        this.#getParameters()
        this.param = []
    }
    #getParameters() {
        JsonImport("searchParameters.json", data => {
            this.data = data.finlandv2  
            console.log(this.data)
            this.#addParameters(this.data)
        })
    }
    #addParameters(data) {
        data.forEach(p => {
            this.param.push(
                new SearchParameter(p)
            )
        })
        const container = document.getElementById("parameters")
        this.param.forEach(p => {
            container.appendChild(p.element)
        })
        // shows and hides prefer / via search boxes depending on which endpoint is selected
        /* if (document.getElementById("apiSelect").value == "hslv2" || document.getElementById("apiSelect").value == "finlandv2") {
            document.getElementById("preferrercontainer").style.display = 'none'
            if (viaStop.type != "visit" || viaStop.id == "") {
                document.getElementById("timeforvisit(s)Container").style.display = "none"
            }
            else {
                document.getElementById("timeforvisit(s)Container").style.display = "block"
            }
        }
        else {
            document.getElementById("preferrercontainer").style.display = 'block'
        } */
    }
}