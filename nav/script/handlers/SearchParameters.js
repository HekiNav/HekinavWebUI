import JsonImport from "./JsonImport.js"
import SearchParameter from "../models/SearchParameter.js"
import Util from "../Util.js"

export default class SearchParameters {
    static from = "";
    static to = "";
    static time = `${Util.padNumber(new Date().getHours())}:${Util.padNumber(new Date().getMinutes())}`
    static date = new Date().toISOString().split('T')[0]

    constructor() {
        this.data
        this.#getParameters()
        this.#setDateInit()
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
    #setDateInit() {
        document.getElementById('input3').value = SearchParameters.time
        document.getElementById('input4').value = SearchParameters.date
    }
    static get getFromTo() {
        let ans = []
        console.log(this.from)
        if(this.from == ""){
            ans[0] = [60.17663436599454, 24.65653036035333]
        }
        if(this.to == ""){
            ans[1] = [60.295692665358935, 25.066264871369405]
        }
        return ans
    }
}