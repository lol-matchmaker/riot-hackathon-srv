import v8 = require('v8');

import Koa = require('koa');

const status = {
  index: async (ctx : Koa.Context, next : () => Promise<any>) => {
    await next();
    ctx.response.body = 'OK';
  },

  memory: async (ctx : Koa.Context, next : () => Promise<any>) => {
    await next();

    ctx.response.body = {
      process: process.memoryUsage(),
      heap: v8.getHeapStatistics(),
    };
  },

  pool: async (ctx : Koa.Context, next : () => Promise<any>) => {
    await next();

    ctx.response.body = {
      ohai: 0,
    };
  },
};

export default status;
