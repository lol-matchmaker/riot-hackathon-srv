import request = require('request-promise-native');

// Extract user's participantId out of match by summonerName
const findParticipantId = async(match_id: string) => {
    const matchJson = await request({
        headers: {'X-Riot-Token': 'RGAPI-5d326d57-5f0d-4c19-a377-fc020817d993'},
        json: true,
        url: `https://na1.api.riotgames.com/lol/match/v4/matches/2904607483`,
    });

    let data = {
        teamId: 0,
        participantId: 0
    }
    for (let participant of matchJson.participantIdentities) {
        if (participant.player.summonerName === 'Vauss') {
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

// returns true if aggressive kill, else false
const isAggressiveKill = async () => {
    let data = await findParticipantId('2904607483')
    const mapJson = await request({
        headers: {'X-Riot-Token': 'RGAPI-5d326d57-5f0d-4c19-a377-fc020817d993'},
        json: true,
        url: `https://na1.api.riotgames.com/lol/match/v4/timelines/by-match/2904607483`,
    });
    for (let frame of mapJson.frames) {
        for (let event of frame.events) {
            if (event.type === 'CHAMPION_KILL' && event.killerId == data.participantId ){
                let y_predicted = -0.9733 * event.position.x + 14629
                if (y_predicted > event.position.y && data.teamId === 200 ||
                    y_predicted < event.position.y && data.teamId === 100) {
                    // blue side kill, team is red
                    // red side kill, team is blue
                    return true
                }
            }
        }
    }
    return false
}

isAggressiveKill().then(function(res) {
    console.log(res)
})

