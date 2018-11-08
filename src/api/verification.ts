import Koa = require('koa');
import { fetchSummonerVerification, fetchProfileByAccountId } from '../fetcher/riot_fetcher';

const verification = {
  bySummonerId: async (ctx: Koa.Context, next: () => Promise<any>) => {
    await next();

    const summonerId = ctx.params.id;
    const verification = await fetchSummonerVerification(summonerId);
    ctx.response.body = {
      summonerId: summonerId,
      verification: verification,
    };
  },

  byAccountId: async (ctx: Koa.Context, next: () => Promise<any>) => {
    await next();

    const accountId = ctx.params.id;
    const profile = await fetchProfileByAccountId(accountId);
    if (profile === null) {
      // TODO(pwnall): not found
      throw new Error("Account not found");
    }

    const summonerId = profile.summoner_id;
    const verification = await fetchSummonerVerification(summonerId);
    ctx.response.body = {
      profile: profile,
      verification: verification,
    };
  },
};

export default verification;
