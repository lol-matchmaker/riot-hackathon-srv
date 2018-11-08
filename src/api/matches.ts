import Koa = require('koa');
import { findMatchesForProfile, findMatch } from '../fetcher/resolver';

const matches = {
  byAccountId: async (ctx: Koa.Context, next: () => Promise<any>) => {
    await next();

    const accountId = ctx.params.id;
    const matches = await findMatchesForProfile(accountId);
    ctx.response.body = matches;
  },

  byMatchId: async (ctx: Koa.Context, next: () => Promise<any>) => {
    await next();

    const matchId = ctx.params.id;
    const fullMatchInfo = await findMatch(matchId);
    ctx.response.body = fullMatchInfo;
  },
};

export default matches;
