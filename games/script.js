const m0 = document.getElementsByClassName('m0')
const m1 = document.getElementsByClassName('m1')
const m2 = document.getElementsByClassName('m2')
const m3 = document.getElementsByClassName('m3') 
const checkboxes1 = document.getElementsByClassName('checkbox1')
const checkboxes2 = document.getElementsByClassName('checkbox2')
let layout = 'main'
let route1
let route2
let routeQueue = []
let gameRounds
let index = 0
let rounds = 10
let round = 1
let types = []
let cities = []
let time = 60
let score = 0
let type = {}
let answer
let loaded = false
//Event listeners
window.addEventListener('load',e => {
    loaded = true
})
window.addEventListener('keydown',event => {
    if (event.key == 'Enter') {
        if (layout == 'main') {
            beginGame()
        } else if (layout == 'results'){
            documentMode('main')
        }
    }
    if (event.key == '1'&&layout=='game') {
        game(1)
    }
    if (event.key == '2'&&layout=='game') {
        game(2)
    }
})
function Route(route,extended) {
    if (extended) {
        return Math.floor(route.time/3600)+'h '+Math.floor(route.time%3600/60)+'min '+route.time%60+'s<br>'+route.distance+' km'
    } else {
        return route.start+' - '+route.end
    }
}
//API call and json extracting function
async function api(amount) {
    let i = 0
    document.getElementById('progressBar').style.width = i*(100/(Number(amount)+5))+15+'%'
    document.getElementById('progress').innerHTML = 'Loading '+(Number(i)+1)+' of '+(Number(amount)+2)
    documentMode('loading')
    //Generate fetching address
    const address = 'https://hekinavv.loophole.site/gameroutes?n='
    //Fetch the data
    while (i < Number(amount) + 2) {
        try {
            const rawdata = await fetch(address,{
                headers: {
                    "Access-Control-Allow-Origin" : "*",
            }})
            //Json handling
            let data = await rawdata.json();
            //Error handling
            if (data.error) {
                console.log('Server error(Heikin ongelma): ' + data.message)
            } 
            else {
                document.getElementById('progress').innerHTML = 'Loading '+(Number(i)+1)+' of '+(Number(amount)+2)
                document.getElementById('progressBar').style.width = i*(100/(Number(amount)+5))+15+'%'
                i++
                routeQueue.push(data)  
            }
        } catch (error) {
            console.log('Error: ',error)
        }
    }
    documentMode('game')
    console.log(routeQueue)
    let route =  await routeQueue.splice(0,1)[0][0]
    document.getElementById('route1').innerHTML = Route(route)
    document.getElementById('route1details').innerHTML= Route(route,true)
    route1 = route
    route =  await routeQueue.splice(0,1)[0][0]
    route2 = route
    document.getElementById('route2').innerHTML = Route(route)
    document.getElementById('route2details').innerHTML= Route(route,true)
    type = types[random(0,types.length-1)]
    document.getElementById('question').innerHTML = type.question
    if (type.function(route1,route2)) {
        answer = 1
    } else {
        answer = 2
    }
    document.getElementById('route1details').hidden = false
    document.getElementById('route2details').hidden = true
}
function random(min, max) {
    return Math.round(Math.random() * (max - min) + min)
}
function documentMode(mode='') {
    if (mode == 'main') {
        layout = mode
        for (let i = 0; i < m0.length; i++) {
            const element = m0.item(i)
            element.hidden = true
        }
        for (let i = 0; i < m1.length; i++) {
            const element = m1.item(i)
            element.hidden = false 
        }
        for (let i = 0; i < m2.length; i++) {
            const element = m2.item(i)
            element.hidden = true  
        }
        for (let i = 0; i < m3.length; i++) {
            const element = m3.item(i)
            element.hidden = true
        }
        maincontent.style.gridTemplateAreas = '"header header""options options""options options""begin begin""begin begin"'
    } else if (mode == 'game'){
        layout = mode
        for (let i = 0; i < m0.length; i++) {
            const element = m0.item(i)
            element.hidden = true
        }
        for (let i = 0; i < m1.length; i++) {
            const element = m1.item(i)
            element.hidden = true
        }
        for (let i = 0; i < m2.length; i++) {
            const element = m2.item(i)
            element.hidden = false
        }
        for (let i = 0; i < m3.length; i++) {
            const element = m3.item(i)
            element.hidden = true
        }
        maincontent.style.gridTemplateAreas = '"information information""question question""route1 route2""route1 route2""route1 route2"'
    } else if (mode == 'results'){
        layout = mode
        for (let i = 0; i < m0.length; i++) {
            const element = m0.item(i)
            element.hidden = true
        }        for (let i = 0; i < m1.length; i++) {
            const element = m1.item(i)
            element.hidden = true 
        }
        for (let i = 0; i < m2.length; i++) {
            const element = m2.item(i)
            element.hidden = true
        }
        for (let i = 0; i < m3.length; i++) {
            const element = m3.item(i)
            element.hidden = false 
        }
        maincontent.style.gridTemplateAreas = '"text text""score score""score score""comment comment""again again"'
    } else if (mode == 'loading'){
        layout = mode
        for (let i = 0; i < m0.length; i++) {
            const element = m0.item(i)
            element.hidden = false
        }        for (let i = 0; i < m1.length; i++) {
            const element = m1.item(i)
            element.hidden = true 
        }
        for (let i = 0; i < m2.length; i++) {
            const element = m2.item(i)
            element.hidden = true
        }
        for (let i = 0; i < m3.length; i++) {
            const element = m3.item(i)
            element.hidden = true 
        }
        maincontent.style.gridTemplateAreas = '"loading loading""loading loading""loading loading""loading loading""loading loading"'
    }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function game(clicked) {
    if (clicked == answer) {
        score++
    }
    round++
    type = types[random(0,types.length-1)]
    document.getElementById('round').innerHTML = 'Round: ' + round + '/' + rounds
    document.getElementById('score').innerHTML = 'Score: ' + score
    document.getElementById('question').innerHTML = type.question
    if (round > rounds) {
        documentMode('results')
        document.getElementById('scoore').innerHTML = score
    } else {
        const route = routeQueue.splice(0,1)[0][0]
        if (random(1,2) == 1) {
            route1 = route

            document.getElementById('route1').innerHTML= Route(route,false)
            document.getElementById('route1details').innerHTML= Route(route,true)

            document.getElementById('route2details').hidden = false
            document.getElementById('route1details').hidden = true
        } else {
            route2 = route

            document.getElementById('route2').innerHTML= Route(route,false)
            document.getElementById('route2details').innerHTML= Route(route,true)

            document.getElementById('route2details').hidden = true
            document.getElementById('route1details').hidden = false
        }
    }
    if (type.function(route1,route2)) {
        answer = 1
    } else {
        answer = 2
    }
}
function beginGame() {
    score = 0
    round = 1
    types = []
    if (loaded) {
        rounds = document.getElementById('roundCount').value
        for (let i = 0; i < checkboxes1.length; i++) {
            const element = checkboxes1.item(i);
            if (element.name == 'distance' && element.checked == true) {
                types.push({function:function name(route1,route2){return route1.distance > route2.distance},question:'Which route is longer?(distance)'})
                types.push({function:function name(route1,route2){return route1.distance < route2.distance},question:'Which route is shorter?(distance)'})
                }
            if (element.name == 'time' && element.checked == true) {
                types.push({function:function name(route1,route2){return route1.time < route2.time},question:'Which route takes less time?'})
                types.push({function:function name(route1,route2){return route1.time > route2.time},question:'Which route takes more time?'})
            }
            }
        }
        if (rounds > 100) {
            alert('Please do not input more than 100 rounds')
        } else if (rounds < 1) {
            alert('Please do not input fewer than 1 round')
        } else if (types.length < 1) {
            alert('Please choose at least one type')
        } else {
            api(rounds)
            document.getElementById('round').hidden = false
            document.getElementById('round').innerHTML = 'Round: '+round+'/'+rounds
            document.getElementById('question').innerHTML = type.question
    }
}
function select(value) {
    if (document.getElementById('c1').checked) {
        for (let i = 0; i < checkboxes1.length; i++) {
            const element = checkboxes1.item(i)
            element.checked = true
        }
    } else {
        for (let i = 0; i < checkboxes1.length; i++) {
            const element = checkboxes1.item(i)
            element.checked = false
        }
    }   
    
}