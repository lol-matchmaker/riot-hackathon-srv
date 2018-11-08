import { Profile, readProfile, writeProfile } from '../db/profile';
import { fetchProfileByAccountId, fetchAccountMatchList, fetchMatchById, FullMatchInfo } from './riot_fetcher';
import { readProfileMatchMetadata, writeMatchProfile, readMatchMetadata } from '../db/match_profile';
import { readMatches, writeMatch, Match, readMatch } from '../db/match';

export async function findProfileByAccountId(accountId: string):
    Promise<Profile> {
  const cachedProfile = await readProfile(accountId);
  if (cachedProfile !== null) {
    return cachedProfile;
  }

  const profile = await fetchProfileByAccountId(accountId);
  await writeProfile(profile);
  return profile;
}

export async function findMatch(matchId: string): Promise<FullMatchInfo> {
  const cachedMatch = await readMatch(matchId);
  if (cachedMatch !== null) {
    const cachedMatchProfiles = await readMatchMetadata(matchId);
    // TODO(pwnall): Replace with correct length.
    if (cachedMatchProfiles.length !== 0) {
      return {
        match: cachedMatch,
        profiles: cachedMatchProfiles,
      };
    }
  }

  const fullMatchInfo = await fetchMatchById(matchId);
  for (const matchProfile of fullMatchInfo.profiles) {
    await writeMatchProfile(matchProfile);
  }
  console.log('Done writing match profiles');

  await writeMatch(fullMatchInfo.match);
  console.log('Done writing match');

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
