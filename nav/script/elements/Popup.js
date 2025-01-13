export default class Popup{
    #loadingHTML
    #mouseDown
    constructor(element) {
        this.isOpen = false
        this.element = element
        this.content = element.querySelector("#popupContent")
        document.getElementById('resizer').addEventListener('mousedown', e => {
            this.#mouseDown = true
        })
        document.getElementById('resizer').addEventListener('touchstart', e => {
            this.#mouseDown = true
        })
        document.getElementById('closePopup').addEventListener('click', e => {
            this.close()
        })
        window.addEventListener('mouseup', e => {
            this.#mouseDown = false
        })
        window.addEventListener('touchend', e => {
            this.#mouseDown = false
        })
        window.addEventListener('mousemove', e => {
            if (this.#mouseDown) {
                this.element.classList.add('notransition');
                this.element.style.top = `${e.clientY}px`
                this.element.style.height = `${window.innerHeight - e.clientY}px`
                this.element.offsetHeight;
                this.element.classList.remove('notransition');
            }
        })
        window.addEventListener('touchmove', e => {
            if (this.#mouseDown) {
                this.element.classList.add('notransition');
                this.element.style.top = `${e.clientY}px`
                this.element.style.height = `${window.innerHeight - e.clientY}px`
                this.element.offsetHeight;
                this.element.classList.remove('notransition');
            }
        })
        this.#loadingHTML = '<div class="lds-ellipsis lds"><div></div><div></div><div></div><div></div><div></div></div><br><div class="lds-ellipsis-reverse lds"><div></div><div></div><div></div><div></div><div></div></div>'
    }
    open(stop){
        this.isOpen = true
        this.element.style.top = `${500}px`
        this.element.style.height = `${window.innerHeight - 500}px`
        this.content.innerHTML = `<h3>${stop.code} ${stop.text}</h3><table><tr><td class="stop-routes">${stop.labels}</td></tr><tr><td><button onclick="setValue(${JSON.stringify(stop.position)},'${stop.name}',1)">Set as origin</button><button onclick="setValue(${JSON.stringify(stop.position)},'${stop.name}',2)">Set as destination</button></td></tr></table><div class="loading"><h4>Loading departures</h4>${this.#loadingHTML}</div>`
    }
    close() {
        this.isOpen = false
        this.element.style.top = '100%'
        this.element.style.height = '0px'
    }
}