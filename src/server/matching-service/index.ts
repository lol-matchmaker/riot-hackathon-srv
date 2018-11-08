var rules = require('./static-data/rules.json');
class matchFinder {
    constructor() {

    }
    findMatches(players:any) {
        var curPlayers:any = [];
        for(var i in players) {
            curPlayers = [];
            curPlayers.push(players[i]);
            var classes:any;
            for(var z in players) {
                calculateScore([...curPlayers, players[z]]);
            }
            
        }
    }
}

function calculateScore(players:any) {
    var curScore:Number = 100;
    // players is an array of the players json.
    for(var i in players) {
        for(var t in players) {
            // If players are the same skip
            if(t == i) {
                continue;
            }

            // Compare scores for classes
            for(var typeI in players[i]["classes"])  {

            }
        }
    }
}

function getLargestKey(dict: any) {
    return Object.keys(dict).reduce(function(a, b){ return dict[a] > dict[b] ? a : b });
}

// function getBest
