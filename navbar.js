fetch('../navbar.html')
.then(res => res.text())
.then(text => {
    let oldelem = document.querySelector("script#replace_with_navbar");
    let newelem = document.createElement("div");
    newelem.innerHTML = text;
    let count = -1
    let items = newelem.firstChild.firstChild.children
    for (let i = 0; i < items.length; i++) {
        const item = items.item(i);
        if (!item.hidden) count++
    }
    document.body.style.setProperty("--nav-items",count)
    oldelem.parentNode.replaceChild(newelem.firstChild,oldelem);
})
