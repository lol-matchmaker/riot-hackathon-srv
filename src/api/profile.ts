import Koa = require('koa');

import { writeProfile } from '../db/profile';
import { writeMatch } from '../db/match';
import { writeMatchProfile } from '../db/match_profile';
import { fetchAccountMatchList, fetchMatchById, fetchProfileByName } from '../fetcher/riot_fetcher';

const profile = {
  new: async (ctx : Koa.Context, next : () => Promise<any>) => {
    await next();

    const name = ctx.query.summoner_name;
    const profile = await fetchProfileByName(name);

    await writeProfile(profile);

    // ----------------------------------------------------------------------------------

    const matchIds = await fetchAccountMatchList(profile.account_id);

    // write matches for each summoner
    for (let matchId of matchIds) {
      const fullMatchInfo = await fetchMatchById(matchId);
      for (const matchProfile of fullMatchInfo.profiles) {
        console.log(matchProfile);
        await writeMatchProfile(matchProfile);
      }
      console.log('Done writing match profiles');

      console.log(fullMatchInfo.match);
      await writeMatch(fullMatchInfo.match);
      console.log('Done writing match');
    }

    ctx.response.body = profile;
  },
};

export default profile;
