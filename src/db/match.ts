import * as Sequelize from 'sequelize';

import { sequelize } from './connection';

interface MatchStats {
  teams: {
    red: any,
    blue: any,
  }
}

// Sequelize service object.
export interface Match {
  id: string,
  map: string,
  stats: MatchStats,

  updated_at? : Date,
}

// Sequelize service object.
interface MatchInstance extends Sequelize.Instance<Match>, Match {
}

// Sequelize model for MatchSummary.
export const MatchModel = sequelize.define<MatchInstance, Match>('match', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  map: Sequelize.STRING,
  stats: Sequelize.JSON,
}, {
  createdAt: false,
  updatedAt: 'updated_at',
});

// Create or update a match in the database cache.
export async function writeMatch(match: Match) {
  await MatchModel.upsert(match);
}

// Fetch a match from the database cache.
export async function readMatch(matchId: string): Promise<Match | null> {
  const match = await MatchModel.findById(matchId);
  if (match === null)
    return null;

  return match;
}

// Fetches a bunch of matches from the database cache.
//
// If the cache does not contain all the requested data, returns the subset of
// the requested matches that do exist.
export async function readMatches(replayIds: string[]) : Promise<Match[]> {
  const matches = await MatchModel.findAll({ where: {
    id: { [Sequelize.Op.in]: replayIds },
  }});

  return matches;
//      filter((record) => record.data_version === matchParserVersion).
//      map((record) => record.data);
}

// Fetch a page of matches from the database cache.
//
// This can be used to iterate over the entire database cache. pageStart should
// be the empty string for the first call. Future calls should use nextPageStart
// as the pageStart value. When nextPageStart is null, the iteration has
// completed.
//
// Each call might return fewer than pageSize results due to internal filtering.
export async function readMatchesPaged(pageStart : string, pageSize : number)
    : Promise<{ data: Match[], nextPageStart: string | null }> {
  const matches = await MatchModel.findAll({
    where: { id: { [Sequelize.Op.gt]: pageStart } },
    order: [ 'id' ], limit: pageSize,
  });

  const resultSize = matches.length;
  const nextPageStart = (resultSize < pageSize) ?
      null : matches[resultSize - 1].id;

  const data = matches;
//      filter((record) => record.data_version === matchParserVersion).
//      map((record) => record.data);

  return { data: data, nextPageStart: nextPageStart };
}
