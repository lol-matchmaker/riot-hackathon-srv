import Koa = require('koa');
import request = require('request-promise-native');

import { writeProfile, Profile } from '../db/profile';
import { writeMatch, Match } from '../db/match';

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
      summoner_name: ctx.query.summoner_name,
      stats: {},
    };
    console.log(jsonObject);
    console.log(jsonObject.accountId);
    console.log(profile);

    // create each summoner's profile
    await writeProfile(profile);

    const match_jsonObject = await request({
      headers: request_header,
      json: true,
      url: base + '/lol/match/v3/matchlists/by-account/' + jsonObject.accountId
    }); 

    // write matches for each summoner
    for (let match of match_jsonObject.matches) {
      const match_model: Match = {
        id: match.gameId,
        map: match.queue,
        stats: {}
      }
      await writeMatch(match_model)
    }

    ctx.response.body = {
      account_id: jsonObject.accountId,
      summoner_id: jsonObject.id,
      summoner_name: ctx.query.summoner_name
    };
  },
};

export default profile;
