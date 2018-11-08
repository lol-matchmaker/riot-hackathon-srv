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
                // for each class in player 1, compare vs all other classes
                var player1Class: any = players[i]["classes"][typeI];
                for(var typeT in players[t]["classes"]) {
                    var player2Class: any = players[t]["classes"][typeT];
                    curScore += rules["rules"]["compPenalty"][player1Class][player2Class];
                }
            }

            // compare score for rank difference
            var rankDiff:any = Math.abs(players[i]["rank"] - players[t]["rank"]);
            // if rank is more than 13 diff just set to 13+
            if(rankDiff >= 13) {
                rankDiff = "13+";
            }

            curScore += rules["rules"]["rankDiffPenalty"][rankDiff];

            // Compare scores for 
        }
    }
}

function getLargestKey(dict: any) {
    return Object.keys(dict).reduce(function(a, b){ return dict[a] > dict[b] ? a : b });
}

// function getBest
