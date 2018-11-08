const request = require("request");

function dbAPI() {

}

dbAPI.prototype.getMatchByMatchID = async function(matchID:any, callback:Function) {
    return new Promise(function (resolve, reject) {
        var url = ` http://localhost:3000/matches/account/${matchID}`;
        // url += "&api_key=" + process.env["RIOTKEY"];
        // url += "?api_key=RGAPI-5d326d57-5f0d-4c19-a377-fc020817d993";
        request.get(url, (res:any, err:any, body:any) => {
            resolve(JSON.parse(body));
        });
    });
}

module.exports = dbAPI;