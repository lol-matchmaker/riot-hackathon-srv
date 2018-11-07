// import * as v8 from 'v8';
// import * as Koa from 'koa';
const v8 = require('v8')
const Koa = require('koa')
var request = require('request-promise-native');

const secret = require('./secret')

const base = 'https://na1.api.riotgames.com'

const profile = {
  new: async(ctx, next) => {
    await next();

    console.log(ctx.query.summoner_name)

    // after that is the .then()
    const htmlString = await request({
      headers: {
          "Origin": "https://developer.riotgames.com",
          "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Riot-Token": secret.api_key,
      },
      url: base + '/lol/summoner/v3/summoners/by-name/' + ctx.query.summoner_name
    });
    
    console.log(htmlString)

    ctx.response.body = {
      ohai: htmlString
    };
  },
};

module.exports = profile;
