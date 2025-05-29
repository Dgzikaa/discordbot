const axios = require('axios');

class CS2Service {
    constructor() {
        this.baseURL = process.env.CS2_API_URL || 'http://localhost:5000';
    }

    async getLiveMatches() {
        try {
            const response = await axios.get(`${this.baseURL}/cs2/matches`);
            return response.data.matches.filter(match => match.live);
        } catch (error) {
            console.error('Erro ao buscar jogos ao vivo CS2:', error.message);
            return [];
        }
    }

    async getUpcomingMatches() {
        try {
            const response = await axios.get(`${this.baseURL}/cs2/matches`);
            return response.data.matches.filter(match => !match.live);
        } catch (error) {
            console.error('Erro ao buscar próximos jogos CS2:', error.message);
            return [];
        }
    }

    async getMatchDetails(matchId) {
        try {
            const response = await axios.get(`${this.baseURL}/cs2/match/${matchId}`);
            return response.data.match;
        } catch (error) {
            console.error(`Erro ao buscar detalhes do jogo ${matchId}:`, error.message);
            return null;
        }
    }

    formatMatchEmbed(match) {
        const embed = {
            title: `${match.team1} vs ${match.team2}`,
            color: match.live ? 0xFF0000 : 0x00FF00,
            fields: [
                {
                    name: 'Evento',
                    value: match.event || 'N/A',
                    inline: true
                },
                {
                    name: 'Formato',
                    value: match.format || 'N/A',
                    inline: true
                }
            ],
            timestamp: new Date()
        };

        if (match.live) {
            embed.fields.push({
                name: 'Status',
                value: '🔴 AO VIVO',
                inline: true
            });

            if (match.score) {
                embed.fields.push({
                    name: 'Placar',
                    value: `${match.score.team1} - ${match.score.team2}`,
                    inline: true
                });
            }
        } else if (match.date) {
            embed.fields.push({
                name: 'Horário',
                value: new Date(match.date).toLocaleString('pt-BR'),
                inline: true
            });
        }

        if (match.streams && match.streams.length > 0) {
            embed.fields.push({
                name: 'Streams',
                value: match.streams.map(stream => `[${stream.name}](${stream.link})`).join('\n')
            });
        }

        return embed;
    }
}

module.exports = new CS2Service(); 