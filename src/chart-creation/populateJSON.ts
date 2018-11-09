const request = require('request');
const classAnalyzer = require("../tag-generator/classAnalyzer");
const fs = require('fs');

async function start() {
    var people:any = await getAllAccounts();
    var data:any = {};
    for(var person of people) {
        var cA:any = await addPlayer(person["account_id"]);
        var data2 = cA.getClasses();
        var totalGames = cA.gamesPlayed;
        cA.getClasses();
        for(let i in data2) {
            data2[i]["percentPlayed"] = data2[i]["gamesPlayed"] / totalGames;
        }
        var test  = {
            games_played: totalGames,
            games_fighter: data2["Fighter"],
            games_mage: data2["Mage"],
            games_tank: data2["Tank"],
            games_marksman: data2["Marksman"],
            games_assassin: data2["Assassin"],
            games_support: data2["Support"]
        }
        data[person["account_id"]] = test;
    }
    
    fs.writeFileSync('./data.json', JSON.stringify(data) , 'utf-8'); 
}

async function getAllAccounts() {
    return new Promise(function (resolve, reject) {
        var url = `http://localhost:3000/allprofiles`;
        // url += "&api_key=" + process.env["RIOTKEY"];
        // url += "?api_key=RGAPI-5d326d57-5f0d-4c19-a377-fc020817d993";
        request.get(url, (res:any, err:any, body:any) => {
            // console.log(body);
            resolve(JSON.parse(body));
        });
    }); 
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

start();