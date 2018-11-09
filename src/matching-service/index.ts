var rules = require('./static-data/rules.json');
class matchFinder {
    public curHS:any = 0;
    public minScore = 70;
    constructor() {

    }
    findMatch(players:any, startIndex:any) {
        var curPlayers:any = [], curPlayersIndex:any = [0];
        var highScore:Number = 0, highScoreIndex:any = 0;
        curPlayers = [];
        curPlayers.push(players[0]);
        for(var i = startIndex; i < startIndex + 5; i ++) {
            if(+i == 0)
                continue
            var classes:any;
            highScore = -100;
            for(var z in players) {
                if(i == +z) {
                    continue;
                }
                if(curPlayersIndex.indexOf(+z) >= 0) {
                    continue;
                }

                var score:Number = calculateScore([...curPlayers, players[z]]);
                if(score > highScore) {
                    highScore = score;
                    highScoreIndex = z;
                }
            }
            curPlayers.push(players[+highScoreIndex]);
            curPlayersIndex.push(+highScoreIndex);
        }
        this.curHS = highScore;
        return curPlayers;
    }

    findSuitableMatch(players:any) {
        if(players.length < 5) {
            return [];
        }
        var curParty = [];
        for (var i in players) {
            curParty = this.findMatch(players, i);
            if(this.curHS > this.minScore) {
                this.minScore = 70;
                return calculateRoles(curParty);
            }
        }
        console.log("x: " + this.minScore);
        this.minScore -= 10;
        this.findSuitableMatch(players);
    }
}

function calculateRoles(players:any) {
    var potentialRoles = ["Top", "Jungle", "Middle", "Bottom", "Support"];
    // players is an array of the players json.
    for(var i in players) {
        // compare roles
        if(potentialRoles.indexOf(players[i]["primaryRole"]) >= 0) {
            potentialRoles.splice(potentialRoles.indexOf(players[i]["primaryRole"]), 1 );
            players[i]["role"] = players[i]["primaryRole"];
        }
        else if(potentialRoles.indexOf(players[i]["secondaryRole"]) >= 0) {
            potentialRoles.splice(potentialRoles.indexOf(players[i]["secondaryRole"]), 1);
            players[i]["role"] = players[i]["secondaryRole"];
        }
        else {
            players[i]["role"] = potentialRoles[0];
            potentialRoles.splice(0, 1);
        }
    }
    return players;
}

function calculateScore(players:any) {
    var curScore:any = 100;
    var numbAggro = 0;
    var potentialRoles = ["Top", "Jungle", "Middle", "Bottom", "Support"];
    // players is an array of the players json.
    for(var i in players) {
        // compare roles
        if(potentialRoles.indexOf(players[i]["primaryRole"]) >= 0) {
            potentialRoles.splice(potentialRoles.indexOf(players[i]["primaryRole"]), 1 );
        }
        else if(potentialRoles.indexOf(players[i]["secondaryRole"]) >= 0) {
            potentialRoles.splice(potentialRoles.indexOf(players[i]["secondaryRole"]), 1);
            curScore = +curScore - 10;
        }
        else {
            potentialRoles.splice(0, 1);
            curScore = +curScore - 30;
        }
        // Add to aggro counter
        numbAggro += +players[i]["aggro"];
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
                    curScore += +rules["rules"]["compPenalty"][player1Class][player2Class];
                }
            }
            // compare score for rank difference
            var rankDiff:any = Math.abs(players[i]["rank"] - players[t]["rank"]);
            // if rank is more than 13 diff just set to 13+
            if(rankDiff >= 13) {
                rankDiff = "13+";
            }
            
            curScore += +rules["rules"]["rankDifferencePenalty"][rankDiff];

            // Compare scores for familiarity
            // if(players[i]["otherPlayers"][players[t]["name"]]) {
            //     curScore += players[i]["otherPlayers"][players[t]["name"]];
            // }
        }        
    }
    if(numbAggro < 3) {
        curScore -= 10 * (5 - numbAggro);
    }
    return curScore;
}

function getLargestKey(dict: any) {
    return Object.keys(dict).reduce(function(a, b){ return dict[a] > dict[b] ? a : b });
}

// function getBest


module.exports = matchFinder;