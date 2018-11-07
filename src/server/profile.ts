import * as Koa from 'koa';
import * as request from 'request-promise-native';

import { writeProfile, Profile } from '../db/profile';

const secret: { api_key: string } = require('./secret.js');

const base = 'https://na1.api.riotgames.com';

const profile = {
  new: async (ctx : Koa.Context, next : () => Promise<any>) => {
    await next();

    console.log(ctx.query.summoner_name)

    // after that is the .then()
    const jsonObject = await request({
      headers: {
          "Origin": "https://developer.riotgames.com",
          "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Riot-Token": secret.api_key,
      },
      json: true,
      url: base + '/lol/summoner/v3/summoners/by-name/' + ctx.query.summoner_name
    });

    const profile: Profile = {
      account_id: jsonObject.accountId,
      summoner_id: jsonObject.id,
      summoner_name: ctx.query.summoner_name,
      stats: {},
    };
    console.log(jsonObject);
    console.log(jsonObject.accountId);
    console.log(profile);

    await writeProfile(profile);

    ctx.response.body = {
      account_id: jsonObject.accountId,
      summoner_id: jsonObject.id,
      summoner_name: ctx.query.summoner_name
    };
  },
};

export default profile;
