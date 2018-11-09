import Koa = require('koa');

import { findProfileByAccountId } from '../fetcher/resolver';
import { fetchProfileByName } from '../fetcher/riot_fetcher';
import { updateStatistics, updateCompatibility } from '../db/profile'

const profile = {
  byName: async (ctx: Koa.Context, next: () => Promise<any>) => {
    await next();

    const name = ctx.params.name;
    const profile = await fetchProfileByName(name);
    ctx.response.body = profile;
  },

  byAccountId: async (ctx: Koa.Context, next: () => Promise<any>) => {
    await next();

    const accountId = ctx.params.id;
    const profile = await findProfileByAccountId(accountId);
    ctx.response.body = profile;
  },
  updateStatistics: async (ctx: Koa.Context, next: () => Promise<any>) => {
    await next();

    const name = ctx.params.name
    const profile = await updateStatistics(ctx.request.body, name);
    ctx.response.body = profile;
  },
};

export default profile;
