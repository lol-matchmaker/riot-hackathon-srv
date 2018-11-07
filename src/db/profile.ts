import * as Sequelize from 'sequelize';

import { sequelize } from './connection';

interface PlayerStats {

}

// Sequelize service object.
export interface Profile {
  account_id : string,
  summoner_id : string,
  summoner_name : string,
  stats : PlayerStats,
}

// Sequelize service object.
interface ProfileInstance extends Sequelize.Instance<Profile>, Profile {
}

// Sequelize model for PlayerProfile.
export const ProfileModel = sequelize.define<ProfileInstance, Profile>(
    'profile', {
  account_id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  summoner_id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  summoner_name: Sequelize.STRING,
  stats: Sequelize.JSON,
}, {
  createdAt: false,
  updatedAt: 'updated_at',
});

// Create or update a profile in the database cache.
export async function writeProfile(profile : Profile) {
  await ProfileModel.upsert(profile);
}

// Fetch a profile from the database cache.
export async function readProfile(accountId : string)
    : Promise<Profile | null> {
  const profile = await ProfileModel.findById(accountId);
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
export async function readProfiles(accountIds : string[])
    : Promise<Profile[]> {
  const profiles = await ProfileModel.findAll({ where: {
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
export async function readProfilesPaged(pageStart : string, pageSize : number)
    : Promise<{ data: Profile[], nextPageStart: string | null }> {
  const profiles = await ProfileModel.findAll({
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
