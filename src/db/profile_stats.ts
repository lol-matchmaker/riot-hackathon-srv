import * as Sequelize from 'sequelize';

import { sequelize } from './connection';

interface PlayerStats {

}

// Sequelize service object.
export interface ProfileStats {
  account_id: string,
  games_played: Number,
  games_fighter: JSON,
  games_mage: JSON,
  games_tank: JSON,
  games_marksman: JSON,
  games_assassin: JSON,
  games_support: JSON,
}

// Sequelize service object.
interface ProfileStatsInstance extends Sequelize.Instance<ProfileStats>, ProfileStats {
}

// Sequelize model for PlayerProfile.
export const ProfileStatModel = sequelize.define<ProfileStatsInstance, ProfileStats>(
    'profileStats', {
  account_id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  games_played: Sequelize.NUMBER,
  games_fighter: Sequelize.JSON,
  games_mage: Sequelize.JSON,
  games_tank: Sequelize.JSON,
  games_marksman: Sequelize.JSON,
  games_assassin: Sequelize.JSON,
  games_support: Sequelize.JSON
}, {
  createdAt: false,
  updatedAt: 'updated_at',
});

// Create or update a profile in the database cache.
export async function writeProfileStats(profile: ProfileStats) {
  await ProfileStatModel.upsert(profile);
}

// Fetch a profile from the database cache.
export async function readProfileStats(accountId: string): Promise<ProfileStats | null> {
  const profile = await ProfileStatModel.findById(accountId);
  if (profile === null) {
    return null;
  }

  // TODO(pwnall): Probably fetch more things here.
  return profile;
}

// Fetch a bunch of profiles from the database cache.
//
// If the cache does not contain all the requested data, returns the subset of
// the requested profiles that do exist.
export async function readProfilesStats(accountIds: string[]): Promise<ProfileStats[]> {
  const profiles = await ProfileStatModel.findAll({ where: {
    account_id: { [Sequelize.Op.in]: accountIds },
  }});

  return profiles;
//      filter((record) => record.data_version === profileParserVersion).
//      map((record) => record.data);
}

// Fetch a page of profiles from the database cache.
//
// This can be used to iterate over the entire database cache. pageStart should
// be the empty string for the first call. Future calls should use nextPageStart
// as the pageStart value. When nextPageStart is null, the iteration has
// completed.
//
// Each call might return fewer than pageSize results due to internal filtering.
export async function readProfilesStatsPaged(pageStart: string, pageSize: number):
    Promise<{ data: ProfileStats[], nextPageStart: string | null }> {
  const profiles = await ProfileStatModel.findAll({
    where: { account_id: { [Sequelize.Op.gt]: pageStart } },
    order: [ 'id' ], limit: pageSize,
  });

  const resultSize = profiles.length;
  const nextPageStart = (resultSize < pageSize) ?
      null : profiles[resultSize - 1].account_id;

  const data = profiles;
//      filter((record) => record.data_version === profileParserVersion).
//      map((record) => record.data);

  return { data: data, nextPageStart: nextPageStart };
}
