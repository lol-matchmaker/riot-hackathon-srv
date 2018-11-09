const classAnalyzer = require("../tag-generator/classAnalyzer") ;
const matchFinder = require("./index");
import request = require('request');

export async function findMatch(players:any) {
    var promises:any = [];
    for(var i in players) {
        // var x = await addPlayer(players[i]["account_id"]);
        promises.push(addPlayer(players[i]["account_id"]));
    }
    await Promise.all(promises).then((data:any)=> {
        var newPlayerQueue = [];
        for(var i in data) {
            newPlayerQueue.push({
                classes: ["Tank", "Mage"],
                name: players[i]["summoner_name"],
                accountId: players[i]["account_id"],
                rank: rankToNumber(players[i]["solo"]),
                aggro: 0,
                seriousness: 50,
                primaryRole: "Middle",
                secondaryRole: "Bottom",
                otherPlayers: players[i]["player_compatibility"]
            });
        }
        console.log(newPlayerQueue);
        var t = new matchFinder();
        console.log(t.findSuitableMatch(newPlayerQueue));
    });
}

function rankToNumber(stringRank:string) {
    var rank = 0;
    var leagues:any = {
        "BRONZE": 1,
        "SILVER": 2,
        "GOLD": 3,
        "PLATINUM": 4, 
        "DIAMOND": 5,
        "MASTERS": 6,
        "CHALLENGER": 6
    }
    var divisions:any = {
        "V": 0,
        "IV": 1,
        "III": 2,
        "II": 3,
        "I": 4
    }
    // console.log((leagues["SILVER"] * 5) + (divisions["V"]));
    if(stringRank == undefined || stringRank == "") {
        rank = (leagues["SILVER"] * 5) + (divisions["V"]);
        return rank;
    }
    var parts = stringRank.split(" ");
    
    if(parts.length == 2) {
        // normal
        rank = (leagues[parts[0]] * 5) + (divisions[parts[1]]);
    }
    else if(parts.length == 1) {
        rank = (leagues[parts[0]] * 5);
    }
    else {
        rank = (leagues["SILVER"] * 5) + (divisions["V"]);
    }
    return rank;
}


async function addPlayer(accountID:any) {
    return new Promise(async function (resolve, reject) {
        var url = `http://localhost:3000/matches/account/${accountID}`;
        await request.get(url, async (err:any, res:any, body:any) => {
            var cA = new classAnalyzer(accountID);
            if(err) {
                console.log(err);
            }
            var playersGames = JSON.parse(body);
            
            await cA.addAllGames(playersGames);
            // console.log(cA.getStats());
            resolve(cA);

        });
    });
}


var temp = [
    {
      "account_id": 41106475,
      "summoner_id": 26650768,
      "summoner_name": "Alpha",
      "solo": "",
      "flex": "",
      "stats": "{}",
      "player_compatibility": "{}",
      "updated_at": "2018-11-08 23:50:23.564-05"
    },
    {
      "account_id": 51233797,
      "summoner_id": 36813385,
      "summoner_name": "Earleking",
      "solo": "DIAMOND V",
      "flex": "PLATINUM II",
      "stats": "{}",
      "player_compatibility": "{}",
      "updated_at": "2018-11-09 00:22:04.735-05"
    },
    {
      "account_id": 47143896,
      "summoner_id": 32350601,
      "summoner_name": "Vexrax",
      "solo": "PLATINUM V",
      "flex": "DIAMOND V",
      "stats": "{}",
      "player_compatibility": "{}",
      "updated_at": "2018-11-09 00:22:34.4-05"
    },
    {
      "account_id": 48302878,
      "summoner_id": 34110207,
      "summoner_name": "Crazilajimpers",
      "solo": "DIAMOND V",
      "flex": "PLATINUM I",
      "stats": "{}",
      "player_compatibility": "{}",
      "updated_at": "2018-11-09 00:22:48.863-05"
    },
    {
      "account_id": 207332419,
      "summoner_id": 44549637,
      "summoner_name": "Testing",
      "solo": "SILVER II",
      "flex": "",
      "stats": "{}",
      "player_compatibility": "{}",
      "updated_at": "2018-11-09 00:22:56.135-05"
    },
    {
      "account_id": 67028,
      "summoner_id": 40187,
      "summoner_name": "Beta",
      "solo": "",
      "flex": "",
      "stats": "{}",
      "player_compatibility": "{}",
      "updated_at": "2018-11-09 00:23:02.822-05"
    },
    {
      "account_id": 202265558,
      "summoner_id": 39258405,
      "summoner_name": "Charlie",
      "solo": "",
      "flex": "",
      "stats": "{}",
      "player_compatibility": "{}",
      "updated_at": "2018-11-09 00:23:11.51-05"
    }
   ]

findMatch(temp);