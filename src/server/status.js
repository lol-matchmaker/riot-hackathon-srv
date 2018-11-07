// import * as v8 from 'v8';
// import * as Koa from 'koa';
const v8 = require('v8')
const Koa = require('koa')

const status = {
  index: async (ctx, next) => {
    await next();
    ctx.response.body = 'OK';
  },

  memory: async(ctx, next) => {
    await next();

    ctx.response.body = {
      process: process.memoryUsage(),
      heap: v8.getHeapStatistics(),
    };
  },

  pool: async(ctx, next) => {
    await next();

    ctx.response.body = {
      ohai: 0,
    };
  },
};

module.exports = status;
