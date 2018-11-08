const rAPI = require("./riotAPI");
var RiotAPI = new rAPI();

class gameAnalyzer {
    public classes: any = {};
    public averageGameStats: any = {};
    public champions: any;
    public tags:any = [];
    constructor(champJSON: JSON) {
        this.champions = champJSON;

        // generate average game stats dict
        this.averageGameStats = {
            "gamesPlayed": 0,
            "visionScore": 0,
            "kills": 0, 
            "deaths": 0,
            "assists": 0,
            "gameLength": 0,
            "csDiff10": 0,
        }
    }

    async addGame(game: any) {
        // Get champion Tags from game
        var championId = game["champion"];
        var currentChampion;
        for(var i in this.champions) {
            // Get the current champion
            if(this.champions[i]["key"] == game["champion"]) {
                currentChampion = this.champions[i]["id"]
                break;
            }
        } 
        var gameData:any = await RiotAPI.getMatchByMatchID(game["gameId"]);
        var participantId:any = 0;
        for(var i in gameData["participants"]) {
            if(gameData["participants"][i]["championId"] == game["champion"]) {
                participantId = i;
                break;
            }
        }
        if(!gameData["seasonId"]) {
            console.log("ded");
            return;
        }
        // console.log(gameData);
        this.addClass(currentChampion, gameData, participantId);
        this.addStats(gameData, participantId);
    }

    addStats(gameData: any, participantId: any) {
        var participantData = gameData["participants"][participantId];
        this.averageGameStats["gamesPlayed"] += 1;

        var ngWeight:any = (1 / this.averageGameStats["gamesPlayed"]).toFixed(2);
        var ogWeight:any = 1 - ngWeight;
        // console.log(this.averageGameStats["gameLength"]);
        this.averageGameStats["visionScore"] = this.averageGameStats["visionScore"] * ogWeight + participantData["stats"]["visionScore"] * ngWeight;
        this.averageGameStats["kills"] = this.averageGameStats["kills"] * ogWeight + participantData["stats"]["kills"] * ngWeight;
        this.averageGameStats["deaths"] = this.averageGameStats["deaths"] * ogWeight + participantData["stats"]["deaths"] * ngWeight;
        this.averageGameStats["assists"] = this.averageGameStats["assists"] * ogWeight + participantData["stats"]["assists"] * ngWeight;
        this.averageGameStats["gameLength"] = this.averageGameStats["gameLength"] * ogWeight + gameData["gameDuration"] * ngWeight;
        try {
            this.averageGameStats["csDiff10"] = this.averageGameStats["csDiff10"] * ogWeight + participantData["timeline"]["csDiffPerMinDeltas"]["0-10"] * ngWeight;
        } catch (error) {
            
        }
    }

    addClass(currentChampion: string, gameData: any, participantId:any) {     
        // Get class tags for current champion
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
            if(gameData["teams"][Math.floor(participantId / 5)]["win"] == "Win") {
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
            if(curClass["gamesPlayed"] > 40) {
                this.tags.push(`High ${i} player`);
            }
            else if(curClass["gamesPlayed"] > 25) {
                this.tags.push(`${i} player`);
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

    getTags() {
        return this.tags;
    }

    getStats() {
        return this.averageGameStats;
    }
}

module.exports = gameAnalyzer;