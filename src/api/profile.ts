import Koa = require('koa');
import request = require('request-promise-native');

import { writeProfile, Profile } from '../db/profile';
import { writeMatch, Match } from '../db/match';
import { MatchProfile, writeMatchProfile } from '../db/match_profile';

const secret: { api_key: string } = require('./secret.js');

const base = 'https://na1.api.riotgames.com';

const request_header = {
  "Origin": "https://developer.riotgames.com",
  'Accept-Charset': 'application/x-www-form-urlencoded; charset=UTF-8',
  'X-Riot-Token': secret.api_key,
}

async function fetchProfileByName(name: string): Promise<Profile> {
  // after that is the .then()
  const jsonObject = await request({
    headers: request_header,
    json: true,
    url: `${base}/lol/summoner/v3/summoners/by-name/${name}`,
  });

  const profile: Profile = {
    account_id: jsonObject.accountId.toString(),  // Riot reports integers.
    summoner_id: jsonObject.id.toString(),  // Riot reports integers.
    summoner_name: jsonObject.name,
    stats: {},
  };
  return profile;
}

async function fetchAccountMatchList(accountId: string): Promise<string[]> {
  const jsonObject = await request({
    headers: request_header,
    json: true,
    url: base + '/lol/match/v3/matchlists/by-account/' + accountId,
  });

  return jsonObject.matches.map((match: any) => match.gameId as string);
}

function teamNameFromRiotId(riotTeamId: number): 'red' | 'blue' {
  switch (riotTeamId) {
    case 100:
      return 'blue';
    case 200:
      return 'red';
    default:
      throw new Error('Unknown team id');
  }
}

interface FullMatchInfo {
  match: Match,
  profiles: MatchProfile[],
}

function matchFromRiotMatchJson(match_jsonObject: any): Match {
  // Match -- game-wide data
  const match: Match = {
    id: match_jsonObject.gameId.toString(),
    map: match_jsonObject.gameMode,
    stats: {
      teams: {
        blue: {},
        red: {},
      },
    },
  };

  for (const teamJson of match_jsonObject.teams) {
    const teamName = teamNameFromRiotId(teamJson.teamId);
    const teamStats = match.stats.teams[teamName];

    teamStats.towerKills = teamJson.towerKills;
    teamStats.inhibitorKills = teamJson.inhibitorKills;
    teamStats.baronKills = teamJson.baronKills;
    teamStats.dragonKills = teamJson.dragonKills;
  }

  return match;
}

async function fetchMatchById(matchId: string): Promise<FullMatchInfo> {
  const match_jsonObject = await request({
    headers: request_header,
    json: true,
    url: base + '/lol/match/v3/matches/' + matchId
  });

  const match = matchFromRiotMatchJson(match_jsonObject);

  const participantsById = new Map<number, any>();
  for (let participant of match_jsonObject.participantIdentities) {
    participantsById.set(participant.participantId, participant.player);
  }

  const matchProfiles: MatchProfile[] = [];
  for (let participant of match_jsonObject.participants) {
    const participantId = participant.participantId;
    const playerInfo = participantsById.get(participantId);
    if (playerInfo === undefined) {
      continue;
    }

    const teamName = teamNameFromRiotId(participant.teamId);

    const matchProfile: MatchProfile = {
      account_id: playerInfo.currentAccountId.toString(),
      match_id: match.id,
      played_at: new Date(),  // TODO: new Date(match_jsonObject.timeCreated),
      data: {
        champion_played: participant.championId, // number
        gold_earned: participant.stats.goldEarned,
        turrets_killed: participant.stats.turretsKilled,
        inhibitorKills: participant.stats.inhibitorKills,
        cs_score: participant.stats.totalMinionsKilled,
        vision_score: participant.stats.visionScore,
        team_name: teamName,
        team_stats: match.stats.teams[teamName],
      },
    };
    matchProfiles.push(matchProfile);
  }

  return {
    match: match,
    profiles: matchProfiles,
  };
}

const profile = {
  new: async (ctx : Koa.Context, next : () => Promise<any>) => {
    await next();

    const name = ctx.query.summoner_name;

    const profile = await fetchProfileByName(name);

    // create each summoner's profile
    console.log(profile);
    await writeProfile(profile);
    console.log('Done writing profile');

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
