
export default class SearchParameter {
    constructor(o) {
        this.type = o.type
        if (o.type == "number") {
            this.min = o.min
            this.max = o.max
        }
        this.label = o.label
        this.default = o.default
        this.graphqlName = o.graphqlName
        this.graphqlCategory1 = o.graphqlCategory1
        this.graphqlCategory2 = o.graphqlCategory2
        this.graphqlCategory3 = o.graphqlCategory3
        this.id = encodeURIComponent(this.label.replaceAll(" ", "").toLowerCase())
        this.element = this.#createElements()
    }
    #createElements() {
        const container = document.createElement("div")
        container.id = this.id + "Container"
        const label = document.createElement("label")
        label.setAttribute("for", this.id)
        label.textContent = this.label + " "
        const input = document.createElement("input")
        input.id = this.id
        input.setAttribute("type", this.type)
        if (this.type == "number") {
            input.value = this.default
            input.setAttribute("min", this.min)
            input.setAttribute("max", this.max)
            input.addEventListener("change", function () {
                let v = parseInt(this.value);
                if (v < this.min) this.value = this.min
                if (v > this.max) this.value = this.max
            })
            container.append(label, input)
        }
        if (this.type == "checkbox") {
            input.checked = this.default
            const slider = document.createElement("span")
            slider.classList.add("slider")
            const background = document.createElement("label")
            background.classList.add("switch")
            background.append(input, slider)
            container.append(label, background)
        }
        return container
    }
    get value() {
        const input = this.element.querySelector("input")
        switch (this.type) {
            case "number":
                return parseInt(input.value)
            case "checkbox":
                return input.checked
            default:
                return input.value
        }
    }
}