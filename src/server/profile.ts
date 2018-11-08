import Koa = require('koa');
import request = require('request-promise-native');

import { writeProfile, Profile } from '../db/profile';
// import { writeMatch, Match } from '../db/match';
// import { writeHistoryEntry, MatchProfile } from '../db/match_profile';

const secret: { api_key: string } = require('./secret.js');

const base = 'https://na1.api.riotgames.com';
const request_header = {
  "Origin": "https://developer.riotgames.com",
  "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
  "X-Riot-Token": secret.api_key,
}

const profile = {
  new: async (ctx : Koa.Context, next : () => Promise<any>) => {
    await next();

    console.log(ctx.query.summoner_name)

    // after that is the .then()
    const jsonObject = await request({
      headers: request_header,
      json: true,
      url: base + '/lol/summoner/v3/summoners/by-name/' + ctx.query.summoner_name
    });

    const profile: Profile = {
      account_id: String(jsonObject.accountId),
      summoner_id: String(jsonObject.id),
      summoner_name: jsonObject.name,
      stats: {},
    };
    console.log(jsonObject);
    console.log(jsonObject.accountId);
    console.log(profile);

    // create each summoner's profile
    await writeProfile(profile);

    // ----------------------------------------------------------------------------------

    const account_matches_jsonObject = await request({
      headers: request_header,
      json: true,
      url: base + '/lol/match/v3/matchlists/by-account/' + jsonObject.accountId
    }); 

    // write matches for each summoner
    for (let match of account_matches_jsonObject.matches) {
      console.log(match)

      const match_jsonObject = await request({
        headers: request_header,
        json: true,
        url: base + '/lol/match/v3/matches/' + match.gameId
      }); 
      console.log(match_jsonObject)

      // MatchProfile -- player specific data
      const match_model = {
        profile_id: profile.account_id,
        match_id: String(match.gameId),
        stats: {

        }
      }
      console.log(match_jsonObject.participantIdentities)
      let playerId = ''
      for (let participant of match_jsonObject.participantIdentities) {
        if (participant.player.summonerName === jsonObject.name)
          console.log('fuck you' + participant.participantId)
          playerId = participant.participantId
      }

      for (let participant of match_jsonObject.participants) {
        if (participant.participantId == playerId) {
          let data = {
            champion_played: participant.championId, // number
            gold_earned: participant.stats.goldEarned,
            turrets_killed: participant.stats.turrets_killed,
            inhibitorKills: participant.stats.inhibitorKills,
            cs_score: participant.stats.totalMinionsKilled,
            wards_placed: participant.stats.wardsPlaced,
          }
          console.log('participant data' + JSON.stringify(data))
        }
      }
        // if (participant.player.summonerName == ctx.query.summoner_name)
        //   participantId = participant.participantId

      console.log(match_model)
      // await writeMatch(match_model)

      // Match -- game-wide data
      const match_profile = {
        match_id : match.gameId,
        queue_name: match.queue,
        map_type: match.gameMode,
        data: {
          game_duration: match_jsonObject.gameDuration
        }
      }
      console.log(match_profile)
      // await writeHistoryEntry(match_profile, profile)

      // matchstats
    // ],
    // "firstInhibitor": true,
    // "win": "Win",
    // "firstRiftHerald": false,
    // "firstBaron": true,
    // "baronKills": 1,
    // "riftHeraldKills": 0,
    // "firstBlood": true,
    // "teamId": 100,
    // "firstTower": true,
    // "vilemawKills": 0,
    // "inhibitorKills": 3,
    // "towerKills": 11,
    // "dominionVictoryScore": 0,
    // "dragonKills": 2
      
    }

    ctx.response.body = {
      account_id: jsonObject.accountId,
      summoner_id: jsonObject.id,
      summoner_name: ctx.query.summoner_name
    };
  },
};

export default profile;
