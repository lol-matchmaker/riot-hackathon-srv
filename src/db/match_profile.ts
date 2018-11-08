import * as Sequelize from 'sequelize';


import { sequelize } from './connection';

interface MatchProfileStats {
}

// Connection between a match and a profile.
export interface MatchProfile {
  account_id: string,
  match_id: string,
  played_at: Date,
  data: MatchProfileStats,
}

// Sequelize service object.
interface MatchProfileInstance extends Sequelize.Instance<MatchProfile>,
    MatchProfile {
}

// Sequelize model for MatchProfileData.
export const MatchProfileModel =
    sequelize.define<MatchProfileInstance, MatchProfile>('match_profile', {
  account_id: Sequelize.STRING,
  match_id: Sequelize.STRING,
  played_at: Sequelize.DATE,
  data : Sequelize.JSON,
}, {
  createdAt: false,
  updatedAt: 'updated_at',
  indexes: [
    // Fetch all the matches belonging to a player.
    { unique: true, fields: [ 'account_id', 'match_id' ]},

    // Fetch all the players beloning to a match.
    // This is only useful if the match hasn't been populated. Otherwise, the
    // match data should have all the player IDs in it.
    { unique: true, fields: [ 'match_id', 'account_id' ]},
  ]
});

export async function readMatchProfile(accountId : string, matchId : string)
    : Promise<MatchProfile | null> {
  const record = await MatchProfileModel.findOne({ where: {
    account_id: { [Sequelize.Op.eq]: accountId },
    match_id: { [Sequelize.Op.eq]: matchId },
  }});
  if (record === null)
    return null;

  return record;
}

// Write a MatchProfile record.
export async function writeMatchProfile(matchProfile: MatchProfile) {
  await MatchProfileModel.upsert(matchProfile);
}

// Fetch metadata for all the matches associated with a profile.
export async function readProfileMatchMetadata(accountId: string)
    : Promise<MatchProfile[]> {
  const records = await MatchProfileModel.findAll({ where: {
    account_id: { [Sequelize.Op.eq]: accountId },
  }});
  return records;
}

// Fetch metadata for all the matches associated with a profile.
//
// If the cache does not contain all the requested data, returns the subset of
// the requested metadata that does exist.
export async function readProfilesMatchMetadata(accountIds: string[])
    : Promise<MatchProfile[]> {
  const records = await MatchProfileModel.findAll({ where: {
    account_id: { [Sequelize.Op.in]: accountIds },
  }});

  return records;
}

// Fetch metadata for a given match.
//
// Metadata entries connect matches with player profiles, so a match can have up
// to 10 metadata entries. The metadata is a subset of the data returned by
// readMatch(), and that method should be preferred in most cases.
export async function readMatchMetadata(matchId : string)
    : Promise<MatchProfile[]> {
  const records = await MatchProfileModel.findAll({ where: {
    match_id: { [Sequelize.Op.eq]: matchId },
  }});

  return records;
}
