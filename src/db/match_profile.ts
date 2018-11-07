import * as Sequelize from 'sequelize';


import { sequelize } from './connection';
import { Profile } from './profile';

interface MatchProfileStats {

}

// Connection between a match and a profile.
export interface MatchProfile {
  profile_id : string,
  match_id : string,
  queue_name: string,
  played_at: Date,
  data: MatchProfileStats,
}

// Sequelize service object.
interface MatchProfileInstance extends Sequelize.Instance<MatchProfile>,
    MatchProfile {
}

// Sequelzie model for MatchProfileData.
export const MatchProfileModel =
    sequelize.define<MatchProfileInstance, MatchProfile>('match_profile', {
  profile_id: Sequelize.STRING,
  match_id: Sequelize.STRING,
  queue_name: Sequelize.STRING,
  played_at: Sequelize.DATE,
  data : Sequelize.JSON,
}, {
  createdAt: false,
  updatedAt: 'updated_at',
  indexes: [
    // Fetch all the matches belonging to a player.
    { unique: true, fields: [ 'profile_id', 'match_id' ]},

    // Fetch all the players beloning to a match.
    // This is only useful if the match hasn't been populated. Otherwise, the
    // match data should have all the player IDs in it.
    { unique: true, fields: [ 'match_id', 'profile_id' ]},
  ]
});

export async function readMatchProfile(playerId : string, replayId : string)
    : Promise<MatchProfile | null> {
  const record = await MatchProfileModel.findOne({ where: {
      profile_id: { [Sequelize.Op.eq]: playerId },
      match_id: { [Sequelize.Op.eq]: replayId },
  }});
  if (record === null)
    return null;

  return record;
}

// Write a MatchProfile record extracted from a MatchHistoryEntry.
export async function writeHistoryEntry(
    entry : MatchHistoryEntry, profile : Profile) {
  await MatchProfileModel.upsert({
    profile_id: entry.playerId,
    match_id: entry.replayId,
    played_at: entry.time,
    stats: {},
  });
}

// Fetch metadata for all the matches associated with a profile.
export async function readProfileMatchMetadata(
    playerId : string, queueName : string)
    : Promise<MatchProfile[]> {
  const records = await MatchProfileModel.findAll({ where: {
      profile_id: { [Sequelize.Op.eq]: playerId },
      queue_name: queueName,
  }});
  return records;
}

// Fetch metadata for all the matches associated with a profile.
//
// If the cache does not contain all the requested data, returns the subset of
// the requested metadata that does exist.
export async function readProfilesMatchMetadata(playerIds : string[])
    : Promise<MatchProfile[]> {
  const records = await MatchProfileModel.findAll({ where: {
    profile_id: { [Sequelize.Op.in]: playerIds },
  }});

  return records;
}

// Fetch metadata for a given match.
//
// Metadata entries connect matches with player profiles, so a match can have up
// to 10 metadata entries. The metadata is a subset of the data returned by
// readMatch(), and that method should be preferred in most cases.
export async function readMatchMetadata(replayId : string)
    : Promise<MatchProfile[]> {
  const records = await MatchProfileModel.findAll({ where: {
    match_id: { [Sequelize.Op.eq]: replayId },
  }});

  return records;
}
