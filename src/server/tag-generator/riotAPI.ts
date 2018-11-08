const request = require("request");

function riotAPI() {

}

riotAPI.prototype.getMatchByMatchID = async function(matchID:any, callback:Function) {
    return new Promise(function (resolve, reject) {
        var url = `https://na1.api.riotgames.com/lol/match/v3/matches/${matchID}`;
        // url += "&api_key=" + process.env["RIOTKEY"];
        url += "?api_key=";
        request.get(url, (res:any, err:any, body:any) => {
            resolve(JSON.parse(body));
        });
    });
}

module.exports = riotAPI;