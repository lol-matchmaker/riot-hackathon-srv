const data = require("./data.json");
var plotly = require('plotly')("Earleking", "dS8WYkaEyy5ePkwBFgOE");



// dS8WYkaEyy5ePkwBFgOE
function accumulateNumber() {
    var arrayNumbs = [];
    var classes:any = {
        "fighter": 0,
        "mage": 0,
        "tank": 0,
        "assassin": 0,
        "marksman": 0,
        "support": 0
    }
    for(var i in data) {
        for(var lolClass in data[i]) {
            // console.log(lolClass);
            if(lolClass == "games_played") {
                continue;
            }
            classes[lolClass.split("_")[1]] += +data[i][lolClass]["gamesPlayed"];
        }
    }
    for(var i in classes) {
        arrayNumbs.push(classes[i]);
    }
    return arrayNumbs;
}

function playRate() {
    var rawNumbers = accumulateNumber();
    var arrayNumbs = [];
    var classes:any = {
        "fighter": 0,
        "mage": 0,
        "tank": 0,
        "assassin": 0,
        "marksman": 0,
        "support": 0
    }
    for(var i in data) {
        for(var lolClass in data[i]) {
            // console.log(lolClass);
            if(lolClass == "games_played") {
                continue;
            }
            classes[lolClass.split("_")[1]] += +data[i][lolClass]["percentPlayed"];
        }
    }
    for(var i in classes) {
        arrayNumbs.push(classes[i]);
    }

    for(var i in arrayNumbs) {
        arrayNumbs[i] = arrayNumbs[i] / rawNumbers[i];
    }
    return arrayNumbs;
}

var z:any = accumulateNumber();
var max:any = Math.max.apply(null,z);

var t:any = playRate();
// console.log(max);
for(var i in t) {
    t[i] = +t[i] * +max;
}

// console.log(t);
var tData = [ 
  {
    type: 'scatterpolar',
    r: z,
    theta: ['Fighter','Mage','Tank', 'Assassin', 'Marksman', 'Support'],
    fill: 'toself'
  },
  {
    type: 'scatterpolar',
    r: t,
    theta: ['Fighter','Mage','Tank', 'Assassin', 'Marksman', 'Support'],
    fill: 'toself'
  }]

// var tData = [{
//     r: t,
//     t: ['Fighter','Mage','Tank', 'Assassin', 'Marksman', 'Support'],
//     name: 'Games Played',
//     marker: {color: 'rgb(242,240,247)'},
//     type: 'barpolar'
//   }];
  
var layout = {
    polar: {
      radialaxis: {
        visible: true,
        range: [0, max]
      }
    },
    showlegend: false
  }
  
plotly.plot(tData, layout, function (err:any, msg:any) {
	if (err) return console.log(err);
	console.log(msg);
});