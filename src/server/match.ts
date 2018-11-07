import * as Koa from 'koa';
import { writeMatch, MatchModel } from '../db/match';

const secret: { api_key: string } = require('./secret.js');

const base = 'https://na1.api.riotgames.com';
const request_header = {
  "Origin": "https://developer.riotgames.com",
  "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
  "X-Riot-Token": secret.api_key,
}

const match = {
  id: async (ctx : Koa.Context, next : () => Promise<any>) => {
    await next();

    console.log(ctx.query.summoner_name)

    // after that is the .then()
    const jsonObject = await request({
      headers: request_header,
      json: true,
      url: base + '/lol/match/v3/matches/' + ctx.query.match_id
    });
    // const profile: MatchModel = {
    //   id: String(matchModel.),
    //   map: string,
    //   data: {},
    // };
    console.log(jsonObject);
    // console.log(profile);

    // await writeMatch(profile);

    ctx.response.body = {
      // account_id: jsonObject.accountId,
      // summoner_id: jsonObject.id,
      // summoner_name: ctx.query.summoner_name
    };
  },
};

export default match;
