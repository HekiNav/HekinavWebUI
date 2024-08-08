function getRoute() {
  window.open("/nav/",'_blank').focus();
}
function Counter(selector, settings){
  this.settings = Object.assign({
    digits: 5,
    delay: 250, // ms
    direction: ''  // ltr is default
  }, settings||{})
  
  var scopeElm = document.querySelector(selector)
  
  // generate digits markup
  var digitsHTML = Array(this.settings.digits + 1).join('<div><b data-value="0"></b></div>')
  scopeElm.innerHTML = digitsHTML;

  this.DOM = {
    scope : scopeElm,
    digits : scopeElm.querySelectorAll('b')
  }
  
  this.DOM.scope.addEventListener('transitionend', e => {
    if (e.pseudoElement === "::before" && e.propertyName == 'margin-top'){
      e.target.classList.remove('blur')
    }
  })
  
  this.count()
}
Counter.prototype.count = function(newVal){
  var countTo, className, 
      settings = this.settings,
      digitsElms = this.DOM.digits;
  
  // update instance's value
  this.value = newVal || this.DOM.scope.dataset.value|0

  if( !this.value ) return;
  
  // convert value into an array of numbers
  countTo = (this.value+'').split('')
  
  if(settings.direction == 'rtl'){
    countTo = countTo.reverse()
    digitsElms = [].slice.call(digitsElms).reverse()
  }
  
  // loop on each number element and change it
  digitsElms.forEach(function(item, i){ 
      if( +item.dataset.value != countTo[i]  &&  countTo[i] >= 0 )
        setTimeout(function(j){
            var diff = Math.abs(countTo[j] - +item.dataset.value);
            item.dataset.value = countTo[j]
            if( diff > 3 )
              item.className = 'blur';
        }, i * settings.delay, i)
  })
}
var counter = new Counter('.numCounter', {direction:'rtl', delay:200, digits:5})
async function numberUp(HTMLelement,amount,seconds) {
    const add = Math.floor(amount / seconds)*80
    const loops = Math.floor(seconds/60)
    let total = 0
    for (let i = 0; i <= loops; i++) {
        total += add + 1    
        HTMLelement.innerHTML = total
        await new Promise(resolve => setTimeout(resolve, 1))
    }
    HTMLelement.innerHTML = amount
}
async function getStats() {
    const address = 'https://hekinavv.loophole.site/stats'
    try {
        const rawdata = await fetch(address,{
            headers: {
                "Access-Control-Allow-Origin" : "*",
        }})
        let data = await rawdata.json();
        if (data.error) {
            console.log('Server error(Heikin ongelma): ' + data.message)
        } 
        else {
            //Finish JSON handling

            counter.count(Number(data[0].routes))
        }
        setTimeout(getStats,5000)
    } catch (error) {
        console.log('Error: ',error)
        }
}
getStats()

  
  
/*   /////////////// create new counter for this demo ///////////////////////
  

  setInterval(randomCount, 3000)
  
  function randomCount(){
    counter.count( getRandomNum(0, 9999999))
  }
  
  function getRandomNum(min,max){
      return Math.floor(Math.random()*(max-min+1) + min)
  } */
