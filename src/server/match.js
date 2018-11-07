// import * as v8 from 'v8';
// import * as Koa from 'koa';
const v8 = require('v8')
const Koa = require('koa')

const match = {
  id: async(summoner_name, next) => {
    await next();

    ctx.response.body = {
      ohai: 0,
    };
  },
};

module.exports = match;
