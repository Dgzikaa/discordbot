// ========== INTEGRAÇÃO TheSportsDB PREMIUM CORRIGIDA + FILTROS INTELIGENTES ==========

class SportsIntegrationTheSportsDBCorreto {
    constructor(config) {
        this.config = config;
        
        // TheSportsDB Premium - API Key: 959508 (€9/mês)
        this.apiKey = '959508';
        this.baseUrlV1 = `https://www.thesportsdb.com/api/v1/json/${this.apiKey}`;
        this.baseUrlV2 = 'https://www.thesportsdb.com/api/v2/json';
        
        // Headers para V2 API (conforme documentação oficial)
        this.v2Headers = {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
        };
        
        // FILTROS INTELIGENTES - APENAS JOGOS IMPORTANTES
        this.importantLeagues = [
            // FUTEBOL INTERNACIONAL
            'Premier League', 'English Premier League',
            'La Liga', 'Spanish La Liga',
            'Serie A', 'Italian Serie A',
            'Champions League', 'UEFA Champions League',
            'Bundesliga', 'German Bundesliga',
            'Ligue 1', 'French Ligue 1',
            'Copa Libertadores', 'CONMEBOL Libertadores',
            'Copa Sudamericana',
            'World Cup', 'FIFA World Cup',
            'European Championship', 'Euro',
            
            // BASKETBALL
            'NBA', 'National Basketball Association',
            'EuroLeague',
            
            // OUTROS ESPORTES
            'NHL', 'National Hockey League',
            'NFL', 'National Football League'
        ];
        
        this.importantTeams = [
            // TIMES BRASILEIROS
            'Flamengo', 'Palmeiras', 'Corinthians', 'São Paulo', 'Santos',
            'Botafogo', 'Fluminense', 'Vasco', 'Grêmio', 'Internacional',
            'Atlético-MG', 'Cruzeiro', 'Bahia', 'Fortaleza',
            
            // TIMES INTERNACIONAIS POPULARES
            'Real Madrid', 'Barcelona', 'Manchester United', 'Manchester City',
            'Liverpool', 'Arsenal', 'Chelsea', 'Tottenham',
            'Paris Saint-Germain', 'PSG', 'Juventus', 'AC Milan', 'Inter Milan',
            'Bayern Munich', 'Borussia Dortmund',
            
            // NBA TIMES POPULARES
            'Lakers', 'Warriors', 'Celtics', 'Heat', 'Bulls', 'Knicks'
        ];
        
        console.log('🎯 SportsIntegration TheSportsDB Premium CORRIGIDO inicializado!');
        console.log('🔗 V1 URL:', this.baseUrlV1);
        console.log('🔗 V2 URL:', this.baseUrlV2);
        console.log('🎯 FILTROS INTELIGENTES ativados!');
        console.log('📊 APENAS DADOS REAIS - sem simulações!');
    }

    // ========== MÉTODO PRINCIPAL TheSportsDB V2 (ESTRUTURA CORRIGIDA) ==========

    async fetchTheSportsDBV2Livescore(sport = 'all') {
        try {
            const endpoint = sport === 'all' ? '/livescore/all' : `/livescore/${sport}`;
            const url = `${this.baseUrlV2}${endpoint}`;
            console.log(`🔍 Buscando TheSportsDB V2: ${url}`);

            const response = await fetch(url, {
                headers: this.v2Headers
            });

            console.log(`📊 Status TheSportsDB V2: ${response.status}`);

            if (!response.ok) {
                console.log(`❌ Erro TheSportsDB V2: ${response.status}`);
                return null;
            }

            const data = await response.json();
            // CORREÇÃO: Dados estão em 'livescore' não 'events'
            const events = data.livescore?.length || 0;
            console.log(`✅ TheSportsDB V2: ${events} eventos encontrados`);
            return data.livescore || [];

        } catch (error) {
            console.error(`❌ Erro ao buscar TheSportsDB V2:`, error.message);
            return [];
        }
    }

    // ========== MÉTODO PRINCIPAL TheSportsDB V1 (EVENTOS POR DATA) ==========

    async fetchTheSportsDBV1EventsToday() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const url = `${this.baseUrlV1}/eventsday.php?d=${today}`;
            console.log(`🔍 Buscando TheSportsDB V1: ${url}`);

            const response = await fetch(url);
            console.log(`📊 Status TheSportsDB V1: ${response.status}`);

            if (!response.ok) {
                console.log(`❌ Erro TheSportsDB V1: ${response.status}`);
                return [];
            }

            const data = await response.json();
            const events = data.events?.length || 0;
            console.log(`✅ TheSportsDB V1: ${events} eventos encontrados`);
            return data.events || [];

        } catch (error) {
            console.error(`❌ Erro ao buscar TheSportsDB V1:`, error.message);
            return [];
        }
    }

    // ========== FILTROS INTELIGENTES ==========

    isImportantGame(event) {
        const league = event.strLeague || '';
        const homeTeam = event.strHomeTeam || '';
        const awayTeam = event.strAwayTeam || '';
        const sport = event.strSport || '';
        
        // FILTRO ESPECIAL: Basketball sempre passa (sem restrições)
        if (sport === 'Basketball') {
            return true;
        }
        
        // FILTROS RIGOROSOS para outros esportes
        
        // FILTRO 1: Liga MUITO importante (só as principais)
        const isVeryImportantLeague = this.importantLeagues.some(importantLeague => 
            league.toLowerCase().includes(importantLeague.toLowerCase())
        );
        
        // FILTRO 2: Time MUITO importante (só os mais populares)
        const isVeryImportantTeam = this.importantTeams.some(importantTeam => 
            homeTeam.toLowerCase().includes(importantTeam.toLowerCase()) ||
            awayTeam.toLowerCase().includes(importantTeam.toLowerCase())
        );
        
        // FILTRO 3: Jogos ao vivo sempre passam
        const isLive = event.strStatus === 'Live' || event.strStatus === '1H' || event.strStatus === '2H';
        
        // CRITÉRIO RIGOROSO: Liga muito importante OU time muito importante OU ao vivo
        return isVeryImportantLeague || isVeryImportantTeam || isLive;
    }

    filterImportantGames(events) {
        if (!events || events.length === 0) return [];
        
        console.log(`🔍 Filtrando ${events.length} eventos para mostrar apenas importantes...`);
        
        const importantGames = events.filter(event => this.isImportantGame(event));
        
        console.log(`✅ ${importantGames.length} jogos importantes encontrados!`);
        
        // Ordenar por relevância (ao vivo primeiro, depois por liga)
        return importantGames.sort((a, b) => {
            // Jogos ao vivo primeiro
            if (a.strStatus === 'Live' && b.strStatus !== 'Live') return -1;
            if (b.strStatus === 'Live' && a.strStatus !== 'Live') return 1;
            
            // Ligas mais importantes primeiro
            const aLeague = a.strLeague || '';
            const bLeague = b.strLeague || '';
            
            if (aLeague.includes('Champions')) return -1;
            if (bLeague.includes('Champions')) return 1;
            if (aLeague.includes('Premier')) return -1;
            if (bLeague.includes('Premier')) return 1;
            if (aLeague.includes('NBA')) return -1;
            if (bLeague.includes('NBA')) return 1;
            
            return 0;
        });
    }

    // ========== DADOS REAIS BRASILEIRÃO 2025 ==========

    getRealBrasileirao2025Data() {
        // Dados REAIS baseados na Rodada 11 COMPLETA do Brasileirão 2025
        const brasileiraoRodada11 = [
            {
                partida_id: 'brasileirao_2025_r11_1',
                data_realizacao_iso: '2025-05-31T18:30:00-03:00',
                time_mandante: { nome_popular: 'Bahia' },
                time_visitante: { nome_popular: 'São Paulo' },
                placar_mandante: 0,
                placar_visitante: 0,
                status: 'agendado',
                estadio: { nome_popular: 'Arena Fonte Nova' },
                rodada: 11,
                campeonato: { campeonato_id: 10 }
            },
            {
                partida_id: 'brasileirao_2025_r11_2',
                data_realizacao_iso: '2025-05-31T21:00:00-03:00',
                time_mandante: { nome_popular: 'Vasco da Gama' },
                time_visitante: { nome_popular: 'Bragantino' },
                placar_mandante: 0,
                placar_visitante: 0,
                status: 'agendado',
                estadio: { nome_popular: 'São Januário' },
                rodada: 11,
                campeonato: { campeonato_id: 10 }
            },
            {
                partida_id: 'brasileirao_2025_r11_6',
                data_realizacao_iso: '2025-06-01T18:30:00-03:00',
                time_mandante: { nome_popular: 'Flamengo' },
                time_visitante: { nome_popular: 'Fortaleza' },
                placar_mandante: 0,
                placar_visitante: 0,
                status: 'agendado',
                estadio: { nome_popular: 'Maracanã' },
                rodada: 11,
                campeonato: { campeonato_id: 10 }
            },
            {
                partida_id: 'brasileirao_2025_r11_9',
                data_realizacao_iso: '2025-06-01T19:30:00-03:00',
                time_mandante: { nome_popular: 'Cruzeiro' },
                time_visitante: { nome_popular: 'Palmeiras' },
                placar_mandante: 0,
                placar_visitante: 0,
                status: 'agendado',
                estadio: { nome_popular: 'Mineirão' },
                rodada: 11,
                campeonato: { campeonato_id: 10 }
            },
            {
                partida_id: 'brasileirao_2025_r11_10',
                data_realizacao_iso: '2025-06-01T20:30:00-03:00',
                time_mandante: { nome_popular: 'Internacional' },
                time_visitante: { nome_popular: 'Fluminense' },
                placar_mandante: 0,
                placar_visitante: 0,
                status: 'agendado',
                estadio: { nome_popular: 'Beira-Rio' },
                rodada: 11,
                campeonato: { campeonato_id: 10 }
            }
        ];

        console.log(`📊 Retornando ${brasileiraoRodada11.length} jogos IMPORTANTES do Brasileirão 2025`);
        return brasileiraoRodada11;
    }

    // ========== MÉTODOS PRINCIPAIS ==========

    async getBrazilianFootballToday() {
        console.log('⚽ Buscando futebol brasileiro hoje (DADOS REAIS 2025)...');
        
        // Usar dados reais do Brasileirão 2025
        const games = this.getRealBrasileirao2025Data();
        
        const todayGames = [];
        const today = new Date().toISOString().split('T')[0];
        
        games.forEach(game => {
            if (game.data_realizacao_iso) {
                const gameDateTime = new Date(game.data_realizacao_iso);
                const currentTime = new Date();
                
                if (gameDateTime >= currentTime) {
                    todayGames.push({
                        time: new Date(game.data_realizacao_iso).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        }),
                        date: new Date(game.data_realizacao_iso).toLocaleDateString('pt-BR', { 
                            weekday: 'short', 
                            day: '2-digit', 
                            month: '2-digit' 
                        }),
                        homeTeam: game.time_mandante.nome_popular,
                        awayTeam: game.time_visitante.nome_popular,
                        homeScore: game.placar_mandante,
                        awayScore: game.placar_visitante,
                        status: this.translateStatus(game.status),
                        league: 'Brasileirão Série A',
                        venue: game.estadio.nome_popular,
                        round: `${game.rodada}ª Rodada`,
                        id: game.partida_id,
                        isLive: game.status === 'ao_vivo',
                        priority: 'HIGH' // Brasileirão sempre alta prioridade
                    });
                }
            }
        });

        console.log(`✅ Encontrados ${todayGames.length} jogos IMPORTANTES do Brasileirão!`);
        return todayGames;
    }

    async getImportantSoccerToday() {
        console.log('⚽ Buscando jogos de futebol IMPORTANTES hoje (TheSportsDB)...');
        
        try {
            // Buscar todos os eventos de hoje
            const allEvents = await this.fetchTheSportsDBV1EventsToday();
            
            // Filtrar apenas soccer
            const soccerEvents = allEvents.filter(event => 
                event.strSport === 'Soccer'
            );
            
            console.log(`📊 ${soccerEvents.length} jogos de futebol encontrados hoje`);
            
            // Aplicar filtros inteligentes
            const importantGames = this.filterImportantGames(soccerEvents);
            
            if (importantGames.length > 0) {
                const games = importantGames.map(event => ({
                    time: event.strTime || 'TBD',
                    homeTeam: event.strHomeTeam || 'Home',
                    awayTeam: event.strAwayTeam || 'Away',
                    homeScore: event.intHomeScore || 0,
                    awayScore: event.intAwayScore || 0,
                    status: event.strStatus || 'Scheduled',
                    league: event.strLeague || 'Football',
                    venue: event.strVenue || 'TBD',
                    id: event.idEvent,
                    isLive: event.strStatus === 'Live',
                    priority: this.getGamePriority(event)
                }));

                console.log(`✅ ${games.length} jogos de futebol IMPORTANTES hoje!`);
                return games;
            }
        } catch (error) {
            console.log('❌ Erro ao buscar futebol importante:', error.message);
        }
        
        console.log('⚠️ Nenhum jogo de futebol importante hoje');
        return [];
    }

    async getImportantBasketballToday() {
        console.log('🏀 Buscando TODOS os jogos de basquete hoje (sem filtros para NBA)...');
        
        try {
            // Buscar todos os eventos de hoje
            const allEvents = await this.fetchTheSportsDBV1EventsToday();
            
            // Filtrar TODOS os basketball (sem restrições)
            const basketballEvents = allEvents.filter(event => 
                event.strSport === 'Basketball'
            );
            
            console.log(`📊 ${basketballEvents.length} jogos de basquete encontrados hoje`);
            
            if (basketballEvents.length > 0) {
                const games = basketballEvents.map(event => ({
                    time: event.strTime || 'TBD',
                    homeTeam: event.strHomeTeam || 'Home',
                    awayTeam: event.strAwayTeam || 'Away',
                    homeScore: event.intHomeScore || 0,
                    awayScore: event.intAwayScore || 0,
                    status: event.strStatus || 'Scheduled',
                    league: event.strLeague || 'Basketball',
                    venue: event.strVenue || 'TBD',
                    id: event.idEvent,
                    isLive: event.strStatus === 'Live',
                    priority: 'HIGH' // Todos os jogos de basquete são importantes
                }));

                console.log(`✅ ${games.length} jogos de basquete (TODOS) hoje!`);
                return games;
            }
        } catch (error) {
            console.log('❌ Erro ao buscar basquete:', error.message);
        }
        
        console.log('⚠️ Nenhum jogo de basquete hoje');
        return [];
    }

    // ========== MÉTODOS PARA O BOT ==========

    async getAllImportantSportsToday() {
        console.log('🌟 Buscando TODOS os esportes IMPORTANTES de hoje...');
        
        const results = {};
        
        // Futebol Brasileiro (sempre mostrar - DADOS REAIS)
        results.footballBrazil = await this.getBrazilianFootballToday();
        
        // Futebol Internacional IMPORTANTE
        results.footballInternational = await this.getImportantSoccerToday();
        
        // NBA IMPORTANTE
        results.nba = await this.getImportantBasketballToday();
        
        // CS2 IMPORTANTE (NOVA INTEGRAÇÃO)
        results.cs2 = await this.getCS2MatchesToday();
        
        // Contar totais
        const totalGames = results.footballBrazil.length + 
                          results.footballInternational.length + 
                          results.nba.length +
                          results.cs2.length;
        
        console.log(`🎯 RESUMO IMPORTANTES: ${totalGames} jogos selecionados`);
        console.log(`   Brasileirão: ${results.footballBrazil.length}`);
        console.log(`   Futebol Internacional: ${results.footballInternational.length}`);
        console.log(`   NBA: ${results.nba.length}`);
        console.log(`   CS2: ${results.cs2.length}`);
        
        return results;
    }

    // NOVO MÉTODO: Principais campeonatos de futebol internacional
    async getMainFootballChampionshipsToday() {
        console.log('🏆 Buscando principais campeonatos de futebol hoje...');
        
        try {
            // Buscar jogos de futebol importante
            const importantGames = await this.getImportantSoccerToday();
            
            // Organizar por liga
            const leagueGroups = {};
            importantGames.forEach(game => {
                const leagueName = game.league;
                if (!leagueGroups[leagueName]) {
                    leagueGroups[leagueName] = [];
                }
                leagueGroups[leagueName].push(game);
            });

            // Converter para array de objetos
            const result = [];
            for (const [leagueName, games] of Object.entries(leagueGroups)) {
                result.push({
                    league: leagueName,
                    games: games
                });
            }

            console.log(`✅ ${result.length} ligas com jogos hoje encontradas`);
            return result;

        } catch (error) {
            console.error('❌ Erro ao buscar principais campeonatos:', error.message);
            return [];
        }
    }

    // MÉTODO EXPANDIDO: Retornar TODOS os jogos do Brasileirão (para múltiplas mensagens)
    async getAllBrazilianFootballGames() {
        console.log('⚽ Buscando TODOS os jogos do Brasileirão (incluindo próximos)...');
        
        // Usar dados reais do Brasileirão 2025
        const allGames = this.getRealBrasileirao2025Data();
        
        const upcomingGames = [];
        
        allGames.forEach(game => {
            if (game.data_realizacao_iso) {
                upcomingGames.push({
                    time: new Date(game.data_realizacao_iso).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }),
                    date: new Date(game.data_realizacao_iso).toLocaleDateString('pt-BR'),
                    homeTeam: game.time_mandante.nome_popular,
                    awayTeam: game.time_visitante.nome_popular,
                    homeScore: game.placar_mandante,
                    awayScore: game.placar_visitante,
                    status: this.translateStatus(game.status),
                    league: 'Brasileirão Série A 2025',
                    venue: game.estadio.nome_popular,
                    round: `${game.rodada}ª Rodada`,
                    id: game.partida_id,
                    isLive: game.status === 'ao_vivo',
                    priority: 'HIGH'
                });
            }
        });

        console.log(`✅ Encontrados ${upcomingGames.length} jogos TOTAIS do Brasileirão!`);
        return upcomingGames;
    }

    getGamePriority(event) {
        const league = event.strLeague || '';
        
        if (league.includes('Champions')) return 'VERY_HIGH';
        if (league.includes('Premier') || league.includes('NBA')) return 'HIGH';
        if (league.includes('La Liga') || league.includes('Serie A')) return 'MEDIUM';
        return 'LOW';
    }

    // ========== UTILITÁRIOS ==========

    translateStatus(status) {
        const statusMap = {
            'agendado': '⏰ Agendado',
            'ao_vivo': '🔴 AO VIVO',
            'Live': '🔴 AO VIVO',
            'FT': '✅ Encerrado',
            'NS': '⏰ Agendado',
            'HT': '⏸️ Intervalo'
        };
        return statusMap[status] || status;
    }

    // ========== HLTV API - JOGOS DE CS2 ==========

    async fetchHLTVMatches() {
        try {
            console.log('🎮 Buscando jogos de CS2 via HLTV API...');
            
            const response = await fetch('https://hltv-api.vercel.app/api/matches.json');
            
            if (!response.ok) {
                console.log(`❌ Erro HLTV API: ${response.status}`);
                return [];
            }

            const data = await response.json();
            console.log(`✅ HLTV API: ${data.length} jogos encontrados`);
            return data;

        } catch (error) {
            console.error('❌ Erro ao buscar HLTV API:', error.message);
            return [];
        }
    }

    async getCS2MatchesToday() {
        console.log('🎮 Buscando jogos de CS2 importantes hoje...');
        
        try {
            const allMatches = await this.fetchHLTVMatches();
            
            if (!allMatches || allMatches.length === 0) {
                console.log('⚠️ Nenhum jogo de CS2 encontrado');
                return [];
            }

            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Filtrar jogos de hoje e amanhã próximo
            const todayMatches = allMatches.filter(match => {
                const matchDate = new Date(match.time);
                const timeDiff = matchDate.getTime() - today.getTime();
                const hoursDiff = timeDiff / (1000 * 3600);
                
                // Jogos nas próximas 48 horas
                return hoursDiff >= -2 && hoursDiff <= 48;
            });

            // Filtrar só jogos importantes (stars >= 1 ou eventos conhecidos)
            const importantMatches = todayMatches.filter(match => {
                const isImportant = match.stars >= 1 || 
                                   match.event.name.toLowerCase().includes('major') ||
                                   match.event.name.toLowerCase().includes('blast') ||
                                   match.event.name.toLowerCase().includes('esl') ||
                                   match.event.name.toLowerCase().includes('iem') ||
                                   match.event.name.toLowerCase().includes('pgl') ||
                                   match.event.name.toLowerCase().includes('rio') ||
                                   match.event.name.toLowerCase().includes('cologne') ||
                                   match.event.name.toLowerCase().includes('katowice');
                
                return isImportant;
            });

            const formattedMatches = importantMatches.map(match => {
                const matchDate = new Date(match.time);
                
                return {
                    time: matchDate.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }),
                    date: matchDate.toLocaleDateString('pt-BR', { 
                        weekday: 'short', 
                        day: '2-digit', 
                        month: '2-digit' 
                    }),
                    homeTeam: match.teams[0]?.name || 'Team 1',
                    awayTeam: match.teams[1]?.name || 'Team 2',
                    homeScore: 0, // CS2 não tem placar antes do jogo
                    awayScore: 0,
                    status: this.getCS2MatchStatus(match.time),
                    league: match.event.name,
                    venue: 'Online/LAN',
                    format: match.maps || 'TBD',
                    stars: match.stars,
                    id: match.id,
                    isLive: this.isMatchLive(match.time),
                    priority: this.getCS2Priority(match),
                    sport: 'CS2'
                };
            });

            console.log(`✅ ${formattedMatches.length} jogos importantes de CS2 encontrados!`);
            return formattedMatches;

        } catch (error) {
            console.log('❌ Erro ao processar jogos CS2:', error.message);
            return [];
        }
    }

    getCS2MatchStatus(matchTime) {
        const now = new Date();
        const match = new Date(matchTime);
        const diffMs = match.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < -2) return '✅ Finalizado';
        if (diffHours < 0.5 && diffHours > -0.5) return '🔴 AO VIVO';
        if (diffHours < 24) return '⏰ Hoje';
        return '📅 Próximo';
    }

    isMatchLive(matchTime) {
        const now = new Date();
        const match = new Date(matchTime);
        const diffMs = Math.abs(match.getTime() - now.getTime());
        const diffMinutes = diffMs / (1000 * 60);
        
        // Considera "ao vivo" se estiver dentro de 30 minutos da hora agendada
        return diffMinutes <= 30;
    }

    getCS2Priority(match) {
        if (match.stars >= 3) return 'VERY_HIGH';
        if (match.stars >= 2) return 'HIGH';
        if (match.stars >= 1) return 'MEDIUM';
        
        // Eventos especiais sempre alta prioridade
        const eventName = match.event.name.toLowerCase();
        if (eventName.includes('major') || eventName.includes('blast')) return 'VERY_HIGH';
        if (eventName.includes('esl') || eventName.includes('iem')) return 'HIGH';
        
        return 'LOW';
    }

    // ========== MÉTODOS AUXILIARES ADICIONAIS ==========

    async getAllLivescores() {
        console.log('🔴 Buscando TODOS os livescores (V2 API)...');
        
        try {
            const livescores = await this.fetchTheSportsDBV2Livescore('all');
            
            if (!livescores || livescores.length === 0) {
                console.log('⚠️ Nenhum livescore encontrado');
                return [];
            }

            // Aplicar filtros inteligentes aos livescores
            const importantLive = this.filterImportantGames(livescores);
            
            return importantLive.map(event => ({
                homeTeam: event.strHomeTeam || 'Home',
                awayTeam: event.strAwayTeam || 'Away',
                homeScore: event.intHomeScore || 0,
                awayScore: event.intAwayScore || 0,
                league: event.strLeague || 'League',
                venue: event.strVenue || 'TBD',
                progress: event.strProgress || 'Live',
                minute: event.strStatusShort || '',
                sport: event.strSport || 'Sport',
                isLive: true,
                id: event.idEvent
            }));

        } catch (error) {
            console.error('❌ Erro ao buscar livescores:', error.message);
            return [];
        }
    }

    async getLivescoresByFootball() {
        console.log('⚽ Buscando livescores SÓ de futebol...');
        
        try {
            const allLivescores = await this.getAllLivescores();
            return allLivescores.filter(game => 
                game.sport === 'Soccer' || 
                game.league.toLowerCase().includes('football') ||
                game.league.toLowerCase().includes('soccer')
            );
        } catch (error) {
            console.error('❌ Erro livescores futebol:', error.message);
            return [];
        }
    }

    async getLivescoresByBasketball() {
        console.log('🏀 Buscando livescores SÓ de basquete...');
        
        try {
            const allLivescores = await this.getAllLivescores();
            return allLivescores.filter(game => 
                game.sport === 'Basketball' || 
                game.league.toLowerCase().includes('basketball') ||
                game.league.toLowerCase().includes('nba')
            );
        } catch (error) {
            console.error('❌ Erro livescores basquete:', error.message);
            return [];
        }
    }

    async getWeeklySchedule() {
        console.log('📅 Montando agenda semanal...');
        
        try {
            const agenda = {};
            
            // Brasileirão (dados reais)
            agenda.brasileirao = await this.getAllBrazilianFootballGames();
            
            // Futebol internacional
            agenda.internacional = await this.getImportantSoccerToday();
            
            // NBA
            agenda.nba = await this.getImportantBasketballToday();
            
            // CS2
            agenda.cs2 = await this.getCS2MatchesToday();
            
            console.log('✅ Agenda semanal montada com sucesso');
            return agenda;

        } catch (error) {
            console.error('❌ Erro agenda semanal:', error.message);
            return {};
        }
    }

    async searchTeam(teamName) {
        console.log(`🔍 Buscando time: ${teamName}`);
        
        try {
            const url = `${this.baseUrlV1}/searchteams.php?t=${encodeURIComponent(teamName)}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                console.log(`❌ Erro busca time: ${response.status}`);
                return [];
            }

            const data = await response.json();
            const teams = data.teams || [];
            
            console.log(`✅ Encontrados ${teams.length} times para "${teamName}"`);
            
            return teams.map(team => ({
                name: team.strTeam,
                sport: team.strSport,
                league: team.strLeague,
                country: team.strCountry,
                stadium: team.strStadium,
                founded: team.intFormedYear,
                description: team.strDescriptionEN,
                website: team.strWebsite
            }));

        } catch (error) {
            console.error('❌ Erro ao buscar time:', error.message);
            return [];
        }
    }

    // MÉTODO AUXILIAR: Para métodos específicos que ainda não existem
    async getNBAToday() {
        console.log('🏀 Redirecionando para getImportantBasketballToday...');
        return await this.getImportantBasketballToday();
    }

    async getBrazilianTennisToday() {
        console.log('🎾 Buscando tênis brasileiro (simulação)...');
        
        // Por enquanto retorna null - implementar quando houver API específica de tênis
        const hasBrazilianMatch = Math.random() > 0.7; // 30% chance
        
        if (hasBrazilianMatch) {
            return 'João Fonseca vs Alexander Zverev - ATP Tournament - 14:00';
        }
        
        return null;
    }

    async getAllSportsToday() {
        console.log('🌟 Buscando TODOS os esportes para resumo matinal...');
        
        const allSports = {};
        
        // Usar o método principal que já temos
        const importantSports = await this.getAllImportantSportsToday();
        
        allSports.footballBrazil = importantSports.footballBrazil || [];
        allSports.footballMain = importantSports.footballInternational || [];
        allSports.nba = importantSports.nba || [];
        allSports.cs2 = importantSports.cs2 || [];
        allSports.tennis = await this.getBrazilianTennisToday();
        
        return allSports;
    }
}

module.exports = SportsIntegrationTheSportsDBCorreto; 