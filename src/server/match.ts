import * as Koa from 'koa';

const match = {
  id: async (ctx : Koa.Context, next : () => Promise<any>) => {
    await next();

    ctx.response.body = {
      ohai: 0,
    };
  },
};

export default match;
