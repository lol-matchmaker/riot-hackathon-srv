const request = require("request");
var accountQueue:any = []
var checkedAccounts:any = {}
async function start(accountId:any)  {
    checkedAccounts[accountId] = 1;
    searchAccount(accountId);
}

async function searchAccount(accountId:any) {
    var temp = await getProfile(accountId);
    var matchList:any = await getMatchlist(accountId);
    if(matchList == null) {
        searchAccount(accountQueue.shift());
    }
    for(var i in matchList) {
        var match:any = await getMatch(matchList[i]["id"]);
        if(match == null) {
            continue;
        }
        match = match["profiles"];
        for(var t in match) {
            if(checkedAccounts[match[t]["account_id"]]) {
                continue;
            }
            accountQueue.push(match[t]["account_id"]);
        }
    }
    searchAccount(accountQueue.shift());
}

async function getProfile(accountId:any) {
    return new Promise(function (resolve, reject) {
        var url = "http://localhost:3000/profiles/" + accountId;
        request.get(url, (err:any, res:any, body:any) => {
            try {
                resolve(JSON.parse(body));
                return;
            } catch (error) {
                return null;
            }
        });
    });
}

async function getMatchlist(accountId:any) {
    return new Promise(function (resolve, reject) {
        var url = "http://localhost:3000/matches/account/" + accountId;
        request.get(url, (err:any, res:any, body:any) => {
            try {
                resolve(JSON.parse(body));
                return;
            } catch (error) {
                return null;
            }
        });
    });
}

async function getMatch(matchId:any) {
    return new Promise(function (resolve, reject) {
        var url = "http://localhost:3000/matches/details/" + matchId;
        request.get(url, (err:any, res:any, body:any) => {
            try {
                resolve(JSON.parse(body));
                return;
            } catch (error) {
                return null;
            }
        });
    });
}

start("45769779");

