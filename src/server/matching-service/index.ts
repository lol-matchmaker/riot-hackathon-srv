var rules = require('./static-data/rules.json');
class matchFinder {
    constructor() {

    }
    findMatches(players:any) {
        for(var i in players) {
            var player:any = players[i];
            var classes:any;
            var bestClass = getLargestKey(rules["rules"]["compPenalty"][classes[0]]);
            
        }
    }
}

function getLargestKey(dict: any) {
    return Object.keys(dict).reduce(function(a, b){ return dict[a] > dict[b] ? a : b });
}

