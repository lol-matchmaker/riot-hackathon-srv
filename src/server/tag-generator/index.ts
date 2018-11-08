const request = require('request');
const champions = require('./static-data/champions.json')["data"];
const classAnalyzer = require("./classAnalyzer") 

async function generateTags(summonerId : any) {
    // Will generate tages for the given Summoner Name
    var url = `https://na1.api.riotgames.com/lol/match/v3/matchlists/by-account/${summonerId}?endIndex=100&queue=440`;
    // url += "&api_key=" + process.env["RIOTKEY"];
    url += "&api_key=RGAPI-5d326d57-5f0d-4c19-a377-fc020817d993";
    request.get(url, (res:any, err:any, body:any) => {
        var playersGames = JSON.parse(body);
        if(playersGames["matches"] == undefined) { // There was an error probably
            return err;
        }
        // Make playersGames an array of their games
        playersGames = playersGames["matches"];

        // analyzeAllGames
        analyzeAllGames(playersGames);
    });
}

async function analyzeAllGames(gameArray:Array<JSON>) {
    var tags:any = [];
    var classes:any = await getClassDict(gameArray);
}

function asyncSleep(ms: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
}

async function getClassDict(gameArray:Array<JSON>) {
    var cA = new classAnalyzer(champions);
    // Generate the classes result
    var promisies:any = [];
    for(var i in gameArray) {
        var game = gameArray[i];
        promisies.push(cA.addGame(game));
        // await asyncSleep(100);
    }
    await Promise.all(promisies);
    console.log(cA.getClasses());
    cA.generateClassTags();
    cA.generateStatTags();
    console.log(cA.getTags());
    return cA.getClasses();
}


generateTags("47143896")
