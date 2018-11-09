import request = require('request-promise-native');

import { Profile } from "../db/profile";
import { Match } from '../db/match';
import { MatchProfile } from '../db/match_profile';

const secret: { api_key: string } = require('./secret.js');

const riotBaseUrl = 'https://na1.api.riotgames.com';

const riotHttpRequestHeaders = {
  'X-Riot-Token': secret.api_key,
};

/** Converts Riot's JSON response into our database storage format.
 *
 * The format's name in Riot's documentation is SummonerDTO.
 */
function profileFromRiotJson(riotAccountJson: any): Profile {
  const profile: Profile = {
    account_id: riotAccountJson.accountId.toString(),  // Riot reports integers.
    summoner_id: riotAccountJson.id.toString(),  // Riot reports integers.
    summoner_name: riotAccountJson.name,
    solo: riotAccountJson.solo,
    flex: riotAccountJson.flex,
    stats: {},
    player_compatibility: {}
  };
  return profile;
}

/** Retrieves basic account information given a summoner name. */
export async function fetchProfileByName(name: string): Promise<Profile> {
  // after that is the .then()
  let riotAccountJson = await request({
    headers: riotHttpRequestHeaders,
    json: true,
    url: `${riotBaseUrl}/lol/summoner/v3/summoners/by-name/${name}`,
  });

  const rankJson = await fetchLeagueById(riotAccountJson.id.toString());
  riotAccountJson = Object.assign(riotAccountJson, rankJson);

  return profileFromRiotJson(riotAccountJson);
}

/** Retrieves league information given a summoner id. */
export async function fetchLeagueById(summonerId: string): Promise<any> {
  // after that is the .then()
  const riotLeagueJson = await request({
    headers: riotHttpRequestHeaders,
    json: true,
    url: `${riotBaseUrl}/lol/league/v3/positions/by-summoner/${summonerId}`,
  });

  const leagueData: { [key: string]: string } = { solo: '', flex: '' };

  for (const riotLeagueInfo of riotLeagueJson) {
    let dataKey: string | null = null;
    switch (riotLeagueInfo.queueType) {
      case 'RANKED_SOLO_5x5':
        dataKey = 'solo';
        break;
      case 'RANKED_FLEX_SR':
        dataKey = 'flex';
        break;
      default:
        break;
    }
    if (dataKey === null) {
      continue;
    }
    leagueData[dataKey] = `${riotLeagueInfo.tier} ${riotLeagueInfo.rank}`;
  }

  return leagueData;
}

/** Retrieves basic account information given an account ID. */
export async function fetchProfileByAccountId(accountId: string):
    Promise<Profile> {
  let riotAccountJson = await request({
    headers: riotHttpRequestHeaders,
    json: true,
    url: `${riotBaseUrl}/lol/summoner/v3/summoners/by-account/${accountId}`,
  });

  const rankJson = await fetchLeagueById(riotAccountJson.id.toString());
  riotAccountJson = Object.assign(riotAccountJson, rankJson);

  return profileFromRiotJson(riotAccountJson);
}

/** Retrieves the IDs of all games played by a user. */
export async function fetchAccountMatchList(accountId: string):
    Promise<string[]> {
  const jsonObject = await request({
    headers: riotHttpRequestHeaders,
    json: true,
    url: `${riotBaseUrl}/lol/match/v3/matchlists/by-account/${accountId}`,
  });

  return jsonObject.matches.map((match: any) => match.gameId.toString());
}

/** Turns Riot team IDs into readable names. */
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

/** The result of processing all the data from a Riot match. */
export interface FullMatchInfo {
  match: Match,
  profiles: MatchProfile[],
}

/** Extracts game-wide data from the Riot API JSON about a match.
 *
 * The format's name in Riot's documentation is MatchDto. This also parses the
 * List[TeamStatsDto] embedded in the MatchDto.
 */
function matchFromRiotMatchJson(riotMatchJson: any): Match {
  // Match -- game-wide data
  const match: Match = {
    id: riotMatchJson.gameId.toString(),
    map: riotMatchJson.gameMode,
    stats: {
      teams: {
        blue: {},
        red: {},
      },
    },
  };

  for (const teamJson of riotMatchJson.teams) {
    const teamName = teamNameFromRiotId(teamJson.teamId);
    const teamStats = match.stats.teams[teamName];

    teamStats.towerKills = teamJson.towerKills;
    teamStats.inhibitorKills = teamJson.inhibitorKills;
    teamStats.baronKills = teamJson.baronKills;
    teamStats.dragonKills = teamJson.dragonKills;
  }

  return match;
}

/** Extracts per-player data from the Riot API JSON about a match.
 *
 * Assumes that the game-wide data was already extracted, using
 * matchFromRiotMatchJson().
 *
 * The top-level format's name in Riot's documentation is MatchDto. This parses
 * the List[ParticipantIdentityDto] and the List[ParticipantDto] embedded in the
 * MatchDto.
 */
function matchProfilesFromRiotMatchJson(match_jsonObject: any, match: Match):
    MatchProfile[] {

  // MatchDto has a List[ParticipantIdentityDto] that maps participants to
  // players, and a separate List[ParticipantDto] that reports participants'
  // performance.
  //
  // We need the ParticipantIdentityDtos indexed by participantId, so we can
  // merge them with the ParticipantDtos.
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

    // get cs deltas
    var csD10 = 0;
    var csD20 = 0;
    var csD30 = 0;
    try {csD10 = participant.timeline.csDiffPerMinDeltas['0-10'];} catch (error) {}
    try {csD20 = participant.timeline.csDiffPerMinDeltas['10-20'];} catch (error) {}
    try {csD30 = participant.timeline.csDiffPerMinDeltas['20-30'];} catch (error) {}
    var win = match_jsonObject["teams"][Math.floor((participantId - 1) / 5)]["win"];
    if(win == "Win") {
        win = true;
    }
    else {
        win = false;
    }

    const matchProfile: MatchProfile = {
      account_id: playerInfo.currentAccountId.toString(),
      match_id: match.id,
      played_at: new Date(),  // TODO: new Date(match_jsonObject.timeCreated),
      data: {
        win: win,
        champion_played: participant.championId, // number
        gold_earned: participant.stats.goldEarned,
        turrets_killed: participant.stats.turretsKilled,
        inhibitorKills: participant.stats.inhibitorKills,
        cs_score: participant.stats.totalMinionsKilled,
        vision_score: participant.stats.visionScore,
        team_name: teamName,
        team_stats: match.stats.teams[teamName],
        kills: participant.stats.kills,
        deaths: participant.stats.deaths,
        assists: participant.stats.assists,
        duration: match_jsonObject.gameDuration,
        cs_difference_0_10: csD10,
        cs_difference_10_20: csD20,
        cs_difference_20_30: csD30
      },
    };
    matchProfiles.push(matchProfile);
  }

  return matchProfiles;
}

export async function fetchMatchById(matchId: string): Promise<FullMatchInfo> {
  const match_jsonObject = await request({
    headers: riotHttpRequestHeaders,
    json: true,
    url: riotBaseUrl + '/lol/match/v3/matches/' + matchId
  });

  const match = matchFromRiotMatchJson(match_jsonObject);
  const matchProfiles = matchProfilesFromRiotMatchJson(match_jsonObject, match);

  return {
    match: match,
    profiles: matchProfiles,
  };
}

export async function fetchSummonerVerification(summonerId: string):
    Promise<string> {
  const riotVerificationString = await request({
    headers: riotHttpRequestHeaders,
    json: true,
    url: `${riotBaseUrl}/lol/platform/v3/third-party-code/by-summoner/${summonerId}`,
  });

  return riotVerificationString;
}