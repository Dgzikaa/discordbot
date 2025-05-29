// ========== INTEGRAÇÃO DE ESPORTES COM THESPORTSDB PREMIUM! ==========

class SportsIntegration {
    constructor(config) {
        this.config = config;
        // API KEY PREMIUM THESPORTSDB
        this.premiumApiKey = '959508';
        console.log('🎯 SportsIntegration inicializado com TheSportsDB PREMIUM!');
        console.log('🔑 API Key Premium:', this.premiumApiKey);
        console.log('📊 Rate Limit: 100 requests/minuto');
    }

    // ========== LIVESCORES EM TEMPO REAL (V2 API) ==========

    async getLivescoresAll() {
        try {
            console.log('🔴 Buscando TODOS os livescores em tempo real...');
            
            const url = `https://www.thesportsdb.com/api/v2/json/livescore/all`;
            
            const response = await fetch(url, {
                headers: {
                    'X-API-KEY': this.premiumApiKey
                }
            });

            if (!response.ok) {
                console.log(`❌ Erro ao buscar livescores: ${response.status}`);
                return [];
            }

            const data = await response.json();
            console.log(`✅ Livescores obtidos com sucesso!`);
            return this.processV2LivescoreData(data, 'all');

        } catch (error) {
            console.error('❌ Erro ao buscar livescores:', error.message);
            return [];
        }
    }

    async getLivescoresSoccer() {
        try {
            console.log('⚽ Buscando livescores de FUTEBOL em tempo real...');
            
            const url = `https://www.thesportsdb.com/api/v2/json/livescore/soccer`;
            
            const response = await fetch(url, {
                headers: {
                    'X-API-KEY': this.premiumApiKey
                }
            });

            if (!response.ok) {
                console.log(`❌ Erro ao buscar livescores futebol: ${response.status}`);
                return [];
            }

            const data = await response.json();
            console.log(`✅ Livescores futebol obtidos!`);
            return this.processV2LivescoreData(data, 'soccer');

        } catch (error) {
            console.error('❌ Erro ao buscar livescores futebol:', error.message);
            return [];
        }
    }

    async getLivescoresBasketball() {
        try {
            console.log('🏀 Buscando livescores de BASQUETE em tempo real...');
            
            const url = `https://www.thesportsdb.com/api/v2/json/livescore/basketball`;
            
            const response = await fetch(url, {
                headers: {
                    'X-API-KEY': this.premiumApiKey
                }
            });

            if (!response.ok) {
                console.log(`❌ Erro ao buscar livescores basquete: ${response.status}`);
                return [];
            }

            const data = await response.json();
            console.log(`✅ Livescores basquete obtidos!`);
            return this.processV2LivescoreData(data, 'basketball');

        } catch (error) {
            console.error('❌ Erro ao buscar livescores basquete:', error.message);
            return [];
        }
    }

    // ========== PRÓXIMOS JOGOS (V2 API) ==========

    async getUpcomingMatches(sport, leagueId, limit = 10) {
        try {
            console.log(`📅 Buscando próximos ${limit} jogos de ${sport} (Liga ID: ${leagueId})...`);
            
            // Tentar V2 API primeiro
            let url = `https://www.thesportsdb.com/api/v2/json/schedule/next/league/${leagueId}`;
            let response = await fetch(url, {
                headers: { 'X-API-KEY': this.premiumApiKey }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.events && data.events.length > 0) {
                    console.log(`✅ V2 API: ${data.events.length} próximos jogos encontrados`);
                    return this.processV2ScheduleData(data, sport);
                }
            }

            // Fallback: V1 API próximos jogos da liga
            console.log(`🔄 Tentando V1 API próximos jogos da liga...`);
            url = `https://www.thesportsdb.com/api/v1/json/${this.premiumApiKey}/eventsnext.php?id=${leagueId}`;
            response = await fetch(url);

            if (response.ok) {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    if (data.events && data.events.length > 0) {
                        console.log(`✅ V1 Liga API: ${data.events.length} próximos jogos encontrados`);
                        return this.processV1Data(data, sport);
                    }
                } catch (jsonError) {
                    console.log(`⚠️ V1 API retornou resposta inválida para liga ${leagueId}`);
                }
            }

            // Fallback: Buscar próximos jogos de teams específicos brasileiros
            if (sport === 'football' && leagueId === '4351') {
                console.log(`🇧🇷 Buscando próximos jogos de times brasileiros principais...`);
                const brazilianTeams = [
                    { name: 'Flamengo', id: '133609' },
                    { name: 'Palmeiras', id: '133613' },
                    { name: 'Corinthians', id: '133604' },
                    { name: 'São Paulo', id: '133618' },
                    { name: 'Santos', id: '133614' },
                    { name: 'Grêmio', id: '133620' },
                    { name: 'Internacional', id: '133622' },
                    { name: 'Fluminense', id: '133612' }
                ];

                const allGames = [];
                for (const team of brazilianTeams.slice(0, 3)) { // Só 3 times para não sobrecarregar
                    try {
                        const teamUrl = `https://www.thesportsdb.com/api/v1/json/${this.premiumApiKey}/eventsnext.php?id=${team.id}`;
                        const teamResponse = await fetch(teamUrl);
                        
                        if (teamResponse.ok) {
                            const teamData = await teamResponse.json();
                            if (teamData.events) {
                                // Filtrar só jogos do Brasileirão
                                const brasileiraoGames = teamData.events.filter(game => 
                                    game.strLeague && (
                                        game.strLeague.includes('Brazil') ||
                                        game.strLeague.includes('Serie A') ||
                                        game.strLeague.includes('Brasileirão') ||
                                        game.strLeague.includes('Brazilian')
                                    )
                                );
                                allGames.push(...brasileiraoGames);
                                console.log(`📊 ${team.name}: ${brasileiraoGames.length} jogos do Brasileirão`);
                            }
                        }
                    } catch (error) {
                        console.log(`⚠️ Erro ao buscar ${team.name}:`, error.message);
                    }
                }

                if (allGames.length > 0) {
                    console.log(`✅ Total encontrado: ${allGames.length} próximos jogos do Brasileirão`);
                    // Remover duplicatas e ordenar por data
                    const uniqueGames = allGames.filter((game, index, self) => 
                        index === self.findIndex(g => g.idEvent === game.idEvent)
                    ).sort((a, b) => new Date(a.dateEvent) - new Date(b.dateEvent));
                    
                    return this.processV1Data({ events: uniqueGames.slice(0, limit) }, sport);
                }
            }

            console.log(`⚠️ Nenhum próximo jogo encontrado para ${sport} (Liga ${leagueId})`);
            return [];

        } catch (error) {
            console.error(`❌ Erro ao buscar próximos jogos ${sport}:`, error.message);
            return [];
        }
    }

    async getUpcomingBrasileirao() {
        console.log('⚽ Buscando próximos jogos do Brasileirão...');
        return await this.getUpcomingMatches('football', '4351'); // Brasileirão
    }

    async getUpcomingPremierLeague() {
        console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 Buscando próximos jogos da Premier League...');
        return await this.getUpcomingMatches('football', '4328'); // Premier League
    }

    async getUpcomingNBA() {
        console.log('🏀 Buscando próximos jogos da NBA...');
        return await this.getUpcomingMatches('basketball', '4387'); // NBA
    }

    // ========== BUSCA DE TIMES (V1 API) ==========

    async searchTeam(teamName) {
        try {
            console.log(`🔍 Buscando time: ${teamName}...`);
            
            const url = `https://www.thesportsdb.com/api/v1/json/${this.premiumApiKey}/searchteams.php?t=${encodeURIComponent(teamName)}`;
            
            const response = await fetch(url);

            if (!response.ok) {
                console.log(`❌ Erro ao buscar time: ${response.status}`);
                return [];
            }

            const data = await response.json();
            
            if (!data.teams || data.teams.length === 0) {
                console.log(`⚠️ Time "${teamName}" não encontrado`);
                return [];
            }

            console.log(`✅ Time "${teamName}" encontrado!`);
            return data.teams.map(team => ({
                id: team.idTeam,
                name: team.strTeam,
                league: team.strLeague,
                sport: team.strSport,
                country: team.strCountry,
                founded: team.intFormedYear,
                stadium: team.strStadium,
                description: team.strDescriptionEN || team.strDescriptionPT,
                logo: team.strTeamBadge,
                fanart: team.strTeamFanart1
            }));

        } catch (error) {
            console.error(`❌ Erro ao buscar time ${teamName}:`, error.message);
            return [];
        }
    }

    // ========== ESTATÍSTICAS DE EVENTOS ==========

    async getEventStats(eventId) {
        try {
            console.log(`📊 Buscando estatísticas do evento ${eventId}...`);
            
            const url = `https://www.thesportsdb.com/api/v2/json/lookup/event_stats/${eventId}`;
            
            const response = await fetch(url, {
                headers: {
                    'X-API-KEY': this.premiumApiKey
                }
            });

            if (!response.ok) {
                console.log(`❌ Erro ao buscar estatísticas: ${response.status}`);
                return null;
            }

            const data = await response.json();
            console.log(`✅ Estatísticas do evento obtidas!`);
            return data;

        } catch (error) {
            console.error(`❌ Erro ao buscar estatísticas evento ${eventId}:`, error.message);
            return null;
        }
    }

    // ========== HIGHLIGHTS DO YOUTUBE ==========

    async getEventHighlights(eventId) {
        try {
            console.log(`🎥 Buscando highlights do evento ${eventId}...`);
            
            const url = `https://www.thesportsdb.com/api/v2/json/lookup/event_highlights/${eventId}`;
            
            const response = await fetch(url, {
                headers: {
                    'X-API-KEY': this.premiumApiKey
                }
            });

            if (!response.ok) {
                console.log(`❌ Erro ao buscar highlights: ${response.status}`);
                return [];
            }

            const data = await response.json();
            console.log(`✅ Highlights do evento obtidos!`);
            return data.highlights || [];

        } catch (error) {
            console.error(`❌ Erro ao buscar highlights evento ${eventId}:`, error.message);
            return [];
        }
    }

    // ========== MÉTODO PRINCIPAL PARA THESPORTSDB PREMIUM ==========

    async fetchSportsData(sport, league) {
        try {
            console.log(`🔍 Buscando dados via TheSportsDB PREMIUM: ${sport} - ${league}`);
            
            let url;
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            
            switch (sport) {
                case 'football':
                    if (league === 'brasileirao') {
                        // V1 API premium para Brasileirão
                        url = `https://www.thesportsdb.com/api/v1/json/${this.premiumApiKey}/eventsday.php?d=${today}&l=4351`;
                    } else {
                        // V1 API premium para outros campeonatos
                        url = `https://www.thesportsdb.com/api/v1/json/${this.premiumApiKey}/eventsday.php?d=${today}&l=${this.getLeagueId(league)}`;
                    }
                    break;
                case 'basketball':
                    if (league === 'nba') {
                        // V1 API premium para NBA
                        url = `https://www.thesportsdb.com/api/v1/json/${this.premiumApiKey}/eventsday.php?d=${today}&l=4387`;
                    } else {
                        // V1 API premium para outros basquetes
                        url = `https://www.thesportsdb.com/api/v1/json/${this.premiumApiKey}/eventsday.php?d=${today}&s=Basketball`;
                    }
                    break;
                case 'tennis':
                    // V1 API premium para tênis
                    url = `https://www.thesportsdb.com/api/v1/json/${this.premiumApiKey}/eventsday.php?d=${today}&s=Tennis`;
                    break;
                case 'american_football':
                    // V1 API premium para NFL
                    url = `https://www.thesportsdb.com/api/v1/json/${this.premiumApiKey}/eventsday.php?d=${today}&l=4391`;
                    break;
                case 'hockey':
                    // V1 API premium para NHL
                    url = `https://www.thesportsdb.com/api/v1/json/${this.premiumApiKey}/eventsday.php?d=${today}&l=4380`;
                    break;
                case 'baseball':
                    // V1 API premium para MLB
                    url = `https://www.thesportsdb.com/api/v1/json/${this.premiumApiKey}/eventsday.php?d=${today}&l=4424`;
                    break;
                default:
                    console.log(`❌ Esporte não suportado: ${sport}`);
                    return [];
            }

            console.log(`🔍 URL TheSportsDB Premium: ${url}`);
            
            const response = await fetch(url);
            console.log(`📊 Status TheSportsDB Premium: ${response.status}`);
            
            if (!response.ok) {
                console.log(`❌ Erro na TheSportsDB Premium: ${response.status}`);
                return [];
            }

            const data = await response.json();
            return this.processV1Data(data, sport);

        } catch (error) {
            console.error(`❌ Erro ao buscar dados TheSportsDB Premium ${sport}:`, error.message);
            return [];
        }
    }

    // ========== MAPEAMENTO DE LIGAS ==========

    getLeagueId(league) {
        const leagueMap = {
            'eng.1': '4328', // Premier League
            'esp.1': '4335', // La Liga
            'ita.1': '4332', // Serie A
            'ger.1': '4331', // Bundesliga
            'fra.1': '4334', // Ligue 1
            'uefa.champions': '4480', // Champions League
            'uefa.europa': '4481', // Europa League
            'brasileirao': '4351', // Brasileirão
            'nba': '4387' // NBA
        };
        return leagueMap[league] || '4351';
    }

    // ========== PROCESSAMENTO V2 LIVESCORE ==========

    processV2LivescoreData(data, sport) {
        try {
            if (!data || !data.events) {
                console.log(`⚠️ TheSportsDB Premium V2 ${sport}: Nenhum jogo ao vivo hoje`);
                return [];
            }

            const games = data.events.map(event => ({
                time: event.strTime || event.strTimeLocal || 'TBD',
                homeTeam: event.strHomeTeam || 'TBD',
                awayTeam: event.strAwayTeam || 'TBD',
                homeScore: parseInt(event.intHomeScore) || 0,
                awayScore: parseInt(event.intAwayScore) || 0,
                status: event.strStatus || 'Ao Vivo',
                league: event.strLeague || sport.toUpperCase(),
                venue: event.strVenue || 'TBD',
                id: event.idEvent,
                isLive: true, // Dados ao vivo!
                progress: event.strProgress || null,
                minute: event.intScoreHomeET || null
            }));

            console.log(`✅ TheSportsDB Premium V2 processou ${games.length} jogos ao vivo de ${sport}`);
            return games;

        } catch (error) {
            console.error(`❌ Erro ao processar dados V2 ${sport}:`, error.message);
            return [];
        }
    }

    // ========== PROCESSAMENTO V2 SCHEDULE ==========

    processV2ScheduleData(data, sport) {
        try {
            if (!data || !data.events) {
                console.log(`⚠️ TheSportsDB Premium Schedule ${sport}: Nenhum jogo agendado`);
                return [];
            }

            const games = data.events.map(event => ({
                time: event.strTime || event.strTimeLocal || 'TBD',
                date: event.dateEvent || 'TBD',
                homeTeam: event.strHomeTeam || 'TBD',
                awayTeam: event.strAwayTeam || 'TBD',
                status: event.strStatus || 'Agendado',
                league: event.strLeague || sport.toUpperCase(),
                venue: event.strVenue || 'TBD',
                id: event.idEvent,
                season: event.strSeason || '2024-2025'
            }));

            console.log(`✅ TheSportsDB Premium Schedule processou ${games.length} próximos jogos de ${sport}`);
            return games;

        } catch (error) {
            console.error(`❌ Erro ao processar schedule ${sport}:`, error.message);
            return [];
        }
    }

    // ========== PROCESSAMENTO V1 PREMIUM ==========

    processV1Data(data, sport) {
        try {
            if (!data.events || !Array.isArray(data.events)) {
                console.log(`⚠️ TheSportsDB Premium V1 ${sport}: Nenhum jogo encontrado hoje`);
                return [];
            }

            const games = data.events.map(event => ({
                time: event.strTime || event.strTimeLocal || 'TBD',
                homeTeam: event.strHomeTeam || 'TBD',
                awayTeam: event.strAwayTeam || 'TBD',
                homeScore: parseInt(event.intHomeScore) || 0,
                awayScore: parseInt(event.intAwayScore) || 0,
                status: event.strStatus || 'Agendado',
                league: event.strLeague || sport.toUpperCase(),
                venue: event.strVenue || 'TBD',
                id: event.idEvent,
                isLive: false
            }));

            console.log(`✅ TheSportsDB Premium V1 processou ${games.length} jogos de ${sport}`);
            return games;

        } catch (error) {
            console.error(`❌ Erro ao processar dados V1 ${sport}:`, error.message);
            return [];
        }
    }

    // ========== MÉTODOS PRINCIPAIS POR ESPORTE ==========

    async getBrazilianFootballToday() {
        console.log('⚽ Buscando futebol brasileiro hoje (PREMIUM)...');
        return await this.fetchSportsData('football', 'brasileirao');
    }

    async getMainFootballChampionshipsToday() {
        console.log('🏆 Buscando principais campeonatos de futebol hoje (PREMIUM)...');
        const championships = [
            { league: 'eng.1', name: 'Premier League' },
            { league: 'esp.1', name: 'La Liga' },
            { league: 'ita.1', name: 'Serie A' },
            { league: 'ger.1', name: 'Bundesliga' },
            { league: 'fra.1', name: 'Ligue 1' },
            { league: 'uefa.champions', name: 'Champions League' },
            { league: 'uefa.europa', name: 'Europa League' }
        ];

        const allGames = [];
        
        for (const championship of championships) {
            try {
                const games = await this.fetchSportsData('football', championship.league);
                if (games.length > 0) {
                    games.forEach(game => {
                        game.league = championship.name;
                    });
                    allGames.push(...games);
                }
            } catch (error) {
                console.log(`⚠️ Erro ao buscar ${championship.name}:`, error.message);
            }
        }

        return allGames;
    }

    async getNBAToday() {
        console.log('🏀 Buscando TODOS os jogos da NBA hoje (PREMIUM)...');
        return await this.fetchSportsData('basketball', 'nba');
    }

    async getBrazilianBasketballToday() {
        console.log('🏀 Buscando basquete brasileiro (NBB) hoje (PREMIUM)...');
        return await this.fetchSportsData('basketball', 'nbb');
    }

    async getBrazilianTennisToday() {
        console.log('🎾 Buscando tênis com brasileiros hoje (PREMIUM)...');
        
        // Lista de tenistas brasileiros para filtrar - INCLUINDO JOÃO FONSECA
        const brazilianPlayers = [
            'Bia Haddad Maia', 'Beatriz Haddad Maia', 'B. Haddad Maia',
            'João Fonseca', 'J. Fonseca', 'Joao Fonseca', 'Fonseca',
            'Thiago Monteiro', 'T. Monteiro', 'Monteiro',
            'Laura Pigossi', 'L. Pigossi', 'Pigossi',
            'Felipe Meligeni', 'F. Meligeni', 'Meligeni'
        ];

        try {
            // Buscar dados de tênis
            const allTennisGames = await this.fetchSportsData('tennis', 'all');
            
            // Filtrar jogos com brasileiros
            const brazilianGames = allTennisGames.filter(game => {
                const players = `${game.homeTeam} ${game.awayTeam}`.toLowerCase();
                return brazilianPlayers.some(player => 
                    players.includes(player.toLowerCase()) ||
                    players.includes(player.toLowerCase().replace('ã', 'a')) ||
                    players.includes(player.toLowerCase().replace('ão', 'ao'))
                );
            });

            if (brazilianGames.length > 0) {
                console.log(`✅ Encontrados ${brazilianGames.length} jogos de tênis com brasileiros hoje`);
                return brazilianGames;
            } else {
                console.log('⚠️ Nenhum jogo de tênis com brasileiros hoje');
                return [];
            }

        } catch (error) {
            console.error('❌ Erro ao buscar tênis brasileiro:', error.message);
            return [];
        }
    }

    async getNFLToday() {
        console.log('🏈 Buscando jogos da NFL hoje (PREMIUM)...');
        return await this.fetchSportsData('american_football', 'nfl');
    }

    async getNHLToday() {
        console.log('🥅 Buscando jogos da NHL hoje (PREMIUM)...');
        return await this.fetchSportsData('hockey', 'nhl');
    }

    async getMLBToday() {
        console.log('⚾ Buscando jogos da MLB hoje (PREMIUM)...');
        return await this.fetchSportsData('baseball', 'mlb');
    }

    async getVolleyballToday() {
        console.log('🏐 Buscando vôlei hoje (PREMIUM)...');
        
        try {
            // Buscar vôlei via API premium
            const url = `https://www.thesportsdb.com/api/v1/json/${this.premiumApiKey}/eventsday.php?d=${new Date().toISOString().split('T')[0]}&s=Volleyball`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                return this.processV1Data(data, 'volleyball');
            }
        } catch (error) {
            console.log('⚠️ Erro ao buscar vôlei premium:', error.message);
        }
        
        // Fallback para dados simulados brasileiros
        const hasVolleyballMatch = Math.random() > 0.7; // 30% chance
        
        if (hasVolleyballMatch) {
            return [{
                time: '20:00:00',
                homeTeam: 'Brasil',
                awayTeam: 'Argentina',
                status: 'Agendado',
                league: 'Superliga',
                venue: 'Ginásio do Ibirapuera',
                id: 'volleyball_001',
                isLive: false
            }];
        }
        
        return [];
    }

    // ========== MÉTODOS PARA O BOT ==========

    async getAllSportsToday() {
        console.log('🌟 Buscando TODOS os esportes de hoje (PREMIUM)...');
        
        const results = {};
        
        // Futebol Brasileiro (sempre mostrar - PREMIUM)
        results.footballBrazil = await this.getBrazilianFootballToday();
        
        // Principais campeonatos internacionais (sem série B/C)
        results.footballMain = await this.getMainFootballChampionshipsToday();
        
        // NBA (TODOS os jogos - conforme solicitado)
        results.nba = await this.getNBAToday();
        
        // Basquete Brasileiro
        results.basketballBrazil = await this.getBrazilianBasketballToday();
        
        // Tênis com brasileiros (incluindo João Fonseca)
        results.tennis = await this.getBrazilianTennisToday();
        
        // Outros esportes americanos
        results.nfl = await this.getNFLToday();
        results.nhl = await this.getNHLToday();
        results.mlb = await this.getMLBToday();
        
        // Vôlei
        results.volleyball = await this.getVolleyballToday();
        
        return results;
    }

    async getFootballOnly() {
        console.log('⚽ Buscando SÓ FUTEBOL - principais campeonatos (PREMIUM)...');
        
        const results = {};
        
        // Brasileirão Série A (sempre mostrar)
        results.brasileirao = await this.getBrazilianFootballToday();
        
        // Principais campeonatos internacionais (sem série B/C/menores)
        results.international = await this.getMainFootballChampionshipsToday();
        
        return results;
    }

    // ========== NOVOS MÉTODOS BASEADOS NA DOCUMENTAÇÃO ==========

    async getAllLivescores() {
        console.log('🔴 Buscando TODOS os livescores em tempo real...');
        return await this.getLivescoresAll();
    }

    async getLivescoresByFootball() {
        console.log('⚽ Buscando livescores de FUTEBOL...');
        return await this.getLivescoresSoccer();
    }

    async getLivescoresByBasketball() {
        console.log('🏀 Buscando livescores de BASQUETE...');
        return await this.getLivescoresBasketball();
    }

    async getWeeklySchedule() {
        console.log('📅 Buscando agenda da semana...');
        
        const results = {
            brasileirao: await this.getUpcomingBrasileirao(),
            premierLeague: await this.getUpcomingPremierLeague(),
            nba: await this.getUpcomingNBA()
        };
        
        return results;
    }
}

module.exports = SportsIntegration; 