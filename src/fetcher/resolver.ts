import { Profile, readProfile, writeProfile } from '../db/profile';
import { ProfileStats, readProfilesStats, writeProfileStats } from '../db/profile_stats';
import { fetchProfileByAccountId, fetchAccountMatchList, fetchMatchById, FullMatchInfo } from './riot_fetcher';
import { readProfileMatchMetadata, writeMatchProfile, readMatchMetadata } from '../db/match_profile';
import { readMatches, writeMatch, Match, readMatch } from '../db/match';

export async function findProfileByAccountId(accountId: string):
    Promise<Profile> {
  const cachedProfile = await readProfile(accountId);
  if (cachedProfile !== null) {
    return cachedProfile;
  }

  let profile;
  try {
    profile = await fetchProfileByAccountId(accountId);
  } catch (readError) {
    console.error(`Failed to read Profile ${accountId}`);
    throw readError;
  }
  try {
    await writeProfile(profile);
  } catch (writeError) {
    console.error(`Failed to write Profile ${profile.account_id}`);
    throw writeError;
  }
  return profile;
}

export async function findMatch(matchId: string): Promise<FullMatchInfo> {
  let cachedMatch;
  try {
    cachedMatch = await readMatch(matchId);
  } catch (readError) {
    console.error(`Failed to read Match ${matchId}`);
    throw readError;
  }
  if (cachedMatch !== null) {
    let cachedMatchProfiles;
    try {
      cachedMatchProfiles = await readMatchMetadata(matchId);
    } catch (readError) {
      console.error(`Failed to read MatchProfiles for Match ${matchId}`);
      throw readError;
    }
    // TODO(pwnall): Check against correct length.
    if (cachedMatchProfiles.length !== 0) {
      return {
        match: cachedMatch,
        profiles: cachedMatchProfiles,
      };
    }
  }

  const fullMatchInfo = await fetchMatchById(matchId);
  for (const matchProfile of fullMatchInfo.profiles) {
    try {
      await writeMatchProfile(matchProfile);
    } catch(writeError) {
      console.error(
        `Failed to write MatchProfile for match=${matchProfile.match_id} ` +
        `account=${matchProfile.account_id}`);
    }
  }

  const match = fullMatchInfo.match;
  try {
    await writeMatch(match);
  } catch(writeError) {
    console.error(`Failed to write Match ${match.id}`);
  }

  return fullMatchInfo;
}

export async function findMatchesForProfile(accountId: string):
    Promise<Match[]> {
  const cachedMatchProfiles = await readProfileMatchMetadata(accountId);
  if (cachedMatchProfiles.length !== 0) {
    const matchIds = cachedMatchProfiles.map(
        matchProfile => matchProfile.match_id);
    const matches = await readMatches(matchIds);
    return matches;
  }

  const matchIds = await fetchAccountMatchList(accountId);
  const matches: Match[] = [];
  for (let matchId of matchIds) {
    const fullMatchInfo = await findMatch(matchId);
    matches.push(fullMatchInfo.match);
  }
  return matches;
}
