import request = require('request-promise-native');
const secret: { api_key: string } = require('../../../src/fetcher/secret.js');


// Extract user's participantId out of match by summonerName
const findParticipantId = async(match_id: number, summonerName: string) => {
    const matchJson = await request({
        headers: {'X-Riot-Token': secret.api_key},
        json: true,
        url: `https://na1.api.riotgames.com/lol/match/v4/matches/${match_id}`,
    });

    let data = {
        teamId: 0,
        participantId: 0
    }
    for (let participant of matchJson.participantIdentities) {
        if (participant.player.summonerName === summonerName) {
            data.participantId = participant.participantId
        }
    }
    for (let participant of matchJson.participants) {
        if (participant.participantId === data.participantId) {
            data.teamId = participant.teamId
        }
    }
    return data
}

// Returns true if aggressive kill count % is greater than 50% in a game, else false
const isAggressiveMatch = async (match_id: number, summonerName: string) => {
    let data = await findParticipantId(match_id, summonerName)
    let kill_count = 0
    let aggressive_kill_count = 0
    const mapJson = await request({
        headers: {'X-Riot-Token': secret.api_key},
        json: true,
        url: `https://na1.api.riotgames.com/lol/match/v4/timelines/by-match/${match_id}`,
    });
    for (let frame of mapJson.frames) {
        for (let event of frame.events) {
            if (event.type === 'CHAMPION_KILL') {
                if (event.killerId == data.participantId ){
                    kill_count += 1
                    let y_predicted = -0.9733 * event.position.x + 14629
                    if (y_predicted > event.position.y && data.teamId === 200 ||
                        y_predicted < event.position.y && data.teamId === 100) {
                        // blue side kill, team is red
                        // red side kill, team is blue
                        aggressive_kill_count += 1
                    }
                }
            }
        }
    }
    if (aggressive_kill_count / kill_count > 0.5) {
        return true
    }
    return false
}

// Returns true if aggressive game count % is greater than 50% in a game, else false
export const isAggressivePlayer = async(accountId: number, summonerName: string) => {
    let game_count = 0
    let aggressive_game_count = 0

    const matchJson = await request({
        headers: {'X-Riot-Token': secret.api_key},
        json: true,
        url: `https://na1.api.riotgames.com/lol/match/v3/matchlists/by-account/${accountId}`,
    });

    for (let match of matchJson.matches) {
        let isAggressive = await isAggressiveMatch(match.gameId, summonerName)
        game_count += 1
        if (isAggressive) {
            aggressive_game_count += 1
        }
    }

    if (aggressive_game_count / game_count > 0.5) {
        return true
    }
    return false
}

// isAggressivePlayer(51345606).then(function(res) {
//     console.log(res)
// })