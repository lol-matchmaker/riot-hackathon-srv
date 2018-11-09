const rAPI = require("./riotAPI");
var RiotAPI = new rAPI();
import {isAggressivePlayer} from "../matching-service/aggressive";
const champions = require('./static-data/champions.json')["data"];

class gameAnalyzer {
    public classes: any;
    public averageGameStats: any = {};
    public champions: any;
    public tags:any = [];
    public accountId:any;
    public gamesPlayed = 0;
    constructor(accountID:any) {
        this.champions = champions;
        this.accountId = accountID;
        // generate average game stats dict
        this.averageGameStats = {
            "gamesPlayed": 0,
            "visionScore": 0,
            "kills": 0, 
            "deaths": 0,
            "assists": 0,
            "gameLength": 0,
            "csDiff10": 0,
            "aggro": false
        }
        this.classes = {
            Marksman: { gamesPlayed: 0, wins: 0, losses: 0, winrate: '0' },
            Assassin: { gamesPlayed: 0, wins: 0, losses: 0, winrate: '0' },
            Mage: { gamesPlayed: 0, wins: 0, losses: 0, winrate: '0' },
            Tank: { gamesPlayed: 0, wins: 0, losses: 0, winrate: '0' },
            Fighter: { gamesPlayed: 0, wins: 0, losses: 0, winrate: '0' },
            Support: { gamesPlayed: 0, wins: 0, losses: 0, winrate: '0' }
        }
    }

    async addAllGames(games:any) {
        var promisies:any = [];
        for(var i in games) {
            var game = games[i];
            promisies.push(this.addGame(game));
            // await asyncSleep(100);
        }
        await Promise.all(promisies);
    }

    async addGame(game: any) {
        this.gamesPlayed += 1;
        // Get champion Tags from game
        var championId = game["champion"];
        var currentChampion;
        
        var gameData:any = await RiotAPI.getMatchByMatchID(game["id"]);
        gameData = gameData["profiles"];
        // return;
        var participantId:any = 0;
        for(var i in gameData) {
            if(gameData[i]["account_id"] == this.accountId) {
                participantId = i;
                break;
            }
        }
        for(var i in this.champions) {
            // Get the current champion
            
            if(this.champions[i]["key"] == gameData[participantId]["data"]["champion_played"]) {
                currentChampion = this.champions[i]["id"]
                break;
            }
        } 
        this.addStats(gameData, participantId);
        this.addClass(currentChampion, gameData, participantId);
    }

    addAggro(participantId:any) {
        
    }

    addStats(gameData: any, participantId: any) {
        // console.log(gameData);
        var participantData = gameData[participantId]["data"];
        this.averageGameStats["gamesPlayed"] += 1;

        var ngWeight:any = (1 / this.averageGameStats["gamesPlayed"]).toFixed(2);
        var ogWeight:any = 1 - ngWeight;
        // console.log(this.averageGameStats["gameLength"]);
        this.averageGameStats["visionScore"] = this.averageGameStats["visionScore"] * ogWeight + participantData["vision_score"] * ngWeight;
        this.averageGameStats["kills"] = this.averageGameStats["kills"] * ogWeight + participantData["kills"] * ngWeight;
        this.averageGameStats["deaths"] = this.averageGameStats["deaths"] * ogWeight + participantData["deaths"] * ngWeight;
        this.averageGameStats["assists"] = this.averageGameStats["assists"] * ogWeight + participantData["assists"] * ngWeight;
        this.averageGameStats["gameLength"] = this.averageGameStats["gameLength"] * ogWeight + participantData["duration"] * ngWeight;
        try {
            this.averageGameStats["csDiff10"] = this.averageGameStats["csDiff10"] * ogWeight + participantData["cs_difference_0_10"] * ngWeight;
        } catch (error) {
            
        }
        // this.averageGameStats 
    }

    addClass(currentChampion: string, gameData: any, participantId:any) {     
        // Get class tags for current champion
        // console.log(currentChampion);
        var classTags = this.champions[currentChampion]["tags"];  

        for(var i in classTags) {
            var champClass = classTags[i];
            // do for all class tags

            if(!this.classes[champClass]) {
                // Class does not exist
                // So create it
               this.classes[champClass] = {
                    "gamesPlayed": 0,
                    "wins": 0,
                    "losses": 0
                }
            }
            // add stats
            this.classes[champClass]["gamesPlayed"] += 1;
            if(gameData[participantId]["data"]["win"] == true) {
                this.classes[champClass]["wins"] += 1;
            }
            else {
                this.classes[champClass]["losses"] += 1;
            }
        }
    }



    getClasses() {
        // Quickly generate winrate for all classes
        for(var i in this.classes) {
            this.classes[i]["winrate"] = (+this.classes[i]["wins"] / +this.classes[i]["gamesPlayed"]).toFixed(2);
        }
        
        return this.classes;
    }

    generateClassTags() {
        
        for(var i in this.classes) {
            var curClass = this.classes[i];
            // if(curClass["gamesPlayed"] > 40) {
            //     this.tags.push(`High ${i} player`);
            // }
            if(curClass["gamesPlayed"] > 25) {
                this.tags.push(`${i}`);
            }
            else if(curClass["gamesPlayed"] > 10 && curClass["winrate"] > .65) {
                this.tags.push(`High WR with ${i}`);
            }
        }
    }

    generateStatTags() {
        if(this.averageGameStats["kills"] > 6) {
            this.tags.push(`High kill player`);
        }
        if(this.averageGameStats["deaths"] > 6) {
            this.tags.push(`High death player`);
        }
        if(this.averageGameStats["deaths"] < 3) {
            this.tags.push(`Low death player`);
        }
        if(this.averageGameStats["assists"] > 8) {
            this.tags.push("High assist player");
        }
        if(this.averageGameStats["assists"] < 4) {
            this.tags.push("Low assist player");
        }
        if(this.averageGameStats["gameLength"] < 1500) {
            this.tags.push("Short games");
        }        
        if(this.averageGameStats["gameLength"] > 2100) {
            this.tags.push("Long games");
        }
        if(this.averageGameStats["csDiff10"] > 1) {
            this.tags.push("Lane dominant player");
        }
        // if(this.averageGameStats)
    }    

    getMostPlayedTags() {

    }

    getBestTags() {
        
    }

    getTags() {
        return this.tags;
    }

    getStats() {
        return this.averageGameStats;
    }
}

function getLargestKey(dict: any) {
    return Object.keys(dict).reduce(function(a, b){ return dict[a] > dict[b] ? a : b });
}

module.exports = gameAnalyzer;