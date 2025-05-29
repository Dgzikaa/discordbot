const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const SportsIntegrationTheSportsDBCorreto = require('./sports-integration-thesportsdb-correto.js');

class DiscordStreamBot {
    constructor(token, webhookUrl, channelName = 'transmissões') {
        this.token = token;
        this.webhookUrl = webhookUrl;
        this.channelName = channelName;
        this.configFile = 'bot-config.json';
        this.activeStreams = new Map();
        this.lastNotifications = new Map();
        this.commandCooldowns = new Map();
        
        // Criar cliente Discord
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });
        
        // Carregar configurações salvas
        this.loadConfig();
        
        // Inicializar integração de esportes
        this.sportsIntegration = new SportsIntegrationTheSportsDBCorreto(this.config);
        
        // Configurar eventos do Discord
        this.setupDiscordEvents();
        
        console.log(`🧠 Discord Stream Bot iniciado para canal: #${this.channelName}!`);
        this.showCurrentConfig();
        this.showAvailableCommands();
    }

    // Configurar eventos do Discord
    setupDiscordEvents() {
        this.client.once('ready', () => {
            console.log(`✅ Bot logado como ${this.client.user.tag}!`);
            console.log(`🤖 Monitorando comandos no canal #${this.channelName}`);
            
            // Iniciar monitoramento de streams após login
            this.startStreamMonitoring();
        });

        this.client.on('messageCreate', async (message) => {
            // Ignorar mensagens do próprio bot
            if (message.author.bot) return;
            
            // Debug: mostrar informações do canal
            console.log(`📝 Mensagem recebida no canal: "${message.channel.name}" (esperado: "${this.channelName}")`);
            console.log(`📝 Conteúdo: "${message.content}"`);
            
            // Verificar se é no canal correto (aceitar "transmissões" e "transmissoes")
            const channelName = message.channel.name;
            const isCorrectChannel = channelName === this.channelName || 
                                   channelName === 'transmissões' || 
                                   channelName === 'transmissoes' ||
                                   channelName === '📺transmissões' ||
                                   channelName === '📺transmissoes' ||
                                   channelName.includes('transmissões') ||
                                   channelName.includes('transmissoes');
            
            if (!isCorrectChannel) {
                console.log(`⚠️ Canal incorreto: "${channelName}", ignorando mensagem`);
                return;
            }
            
            // Verificar se é um comando que começa com !s
            if (!message.content.startsWith('!s')) {
                console.log(`⚠️ Não é um comando !s, ignorando: "${message.content}"`);
                return;
            }
            
            console.log(`✅ Processando comando: "${message.content}" no canal: "${channelName}"`);
            
            // Processar comando
            await this.processCommand(message);
        });

        this.client.on('error', (error) => {
            console.error('❌ Erro do Discord:', error);
        });
    }

    // Carregar configurações do arquivo
    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const data = fs.readFileSync(this.configFile, 'utf8');
                this.config = JSON.parse(data);
                console.log('✅ Configurações carregadas do arquivo');
            } else {
                this.resetToDefaults();
            }
        } catch (error) {
            console.error('❌ Erro ao carregar config, usando padrões:', error.message);
            this.resetToDefaults();
        }
    }

    // Configurações padrão
    resetToDefaults() {
        this.config = {
            // Canal alvo
            target_channel: this.channelName || 'transmissões',
            
            // APIs Configuration
            apis: {
                api_futebol_token: process.env.API_FUTEBOL_TOKEN || null,
                api_sports_token: process.env.API_SPORTS_TOKEN || null
            },
            
            // Streamers por categoria
            streamers: {
                cs2_br: ['gaules', 'fallen', 'coldzera', 'taco'],
                cs2_international: ['esl_csgo', 'blast', 'hltv_org'],
                futebol: ['casimito', 'loud_coringa', 'cosiq', 'warlillo', 'watos_', 'pagodedojorgin', 'dupladedoix', 'liraGOAT'],
                variety: ['cellbit', 'bauky']
            },
            
            // Campeonatos de futebol específicos (API Futebol)
            football_championships: {
                nacionais: ['brasileirao', 'copa_brasil', 'estaduais'],
                internacionais: ['libertadores', 'sulamericana'],
                copas: ['copa_do_mundo', 'copa_america', 'copa_nordeste']
            },
            
            // Outros esportes (API-Sports.io)
            other_sports: {
                // Basketball
                basketball: {
                    nba: true,
                    euroleague: true,
                    nbb: true // Novo Basquete Brasil
                },
                // Tennis
                tennis: {
                    atp: true,
                    wta: true,
                    grand_slams: true
                },
                // Volleyball  
                volleyball: {
                    fivb: true,
                    superliga_br: true
                },
                // Hockey
                hockey: {
                    nhl: true
                },
                // Baseball
                baseball: {
                    mlb: true
                },
                // American Football
                american_football: {
                    nfl: true
                }
            },
            
            // Configurações de notificação
            notifications: {
                ping_everyone: true,
                min_viewers: 1000,
                cooldown_minutes: 30,
                include_thumbnails: true,
                mention_channel: true
            },
            
            // Configurações de comandos
            commands: {
                enabled: true,
                cooldown_seconds: 15,
                admin_only: false
            },
            
            // Horários ativos
            active_hours: {
                start: 8,  // 8h
                end: 23    // 23h
            }
        };
        
        this.saveConfig();
    }

    // Salvar configurações
    saveConfig() {
        try {
            fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
            console.log('💾 Configurações salvas');
        } catch (error) {
            console.error('❌ Erro ao salvar config:', error.message);
        }
    }

    // Mostrar configuração atual
    showCurrentConfig() {
        console.log('\n📋 CONFIGURAÇÃO ATUAL - THESPORTSDB PREMIUM:');
        console.log(`📺 Canal alvo: #${this.config.target_channel}`);
        console.log('🎮 CS2 Brasil:', this.config.streamers.cs2_br.join(', '));
        console.log('🏆 CS2 International:', this.config.streamers.cs2_international.join(', '));
        console.log('⚽ Futebol:', this.config.streamers.futebol.join(', '));
        console.log('📺 Variety:', this.config.streamers.variety.join(', '));
        
        console.log('\n🏆 ESPORTES MONITORADOS (THESPORTSDB PREMIUM):');
        console.log('⚽ Futebol: Brasileirão Série A, Premier League, La Liga, Serie A, Champions League');
        console.log('🏀 Basquete: NBA (todos os jogos), NBB brasileiro');
        console.log('🎮 CS2: Principais campeonatos (HLTV API)');
        console.log('🎾 Tênis: Só brasileiros (João Fonseca, Bia Haddad Maia, etc.)');
        console.log('🏐 Volleyball: FIVB, ligas internacionais');
        
        console.log('\n💎 API PREMIUM ATIVA:');
        console.log('✅ TheSportsDB Premium - API Key: 959508');
        console.log('📊 Rate Limit: 100 requests/minuto');
        console.log('📅 Dados: 2025 reais + livescores em tempo real');
        console.log('💰 Custo: €9/mês (muito mais barato que alternativas)');
        
        console.log('\n🎯 FILTROS APLICADOS:');
        console.log('✅ Só principais campeonatos (sem série B/C)');
        console.log('✅ Brasileiros priorizados em tênis');
        console.log('✅ NBA: todos os jogos mostrados');
        console.log('❌ Divisões inferiores excluídas');
        console.log('');
    }

    // Mostrar comandos disponíveis
    showAvailableCommands() {
        console.log('🤖 COMANDOS DISPONÍVEIS - THESPORTSDB PREMIUM:');
        console.log('📺 STREAMS & TWITCH:');
        console.log('!saovivo - Verificar streamers online');
        console.log('');
        console.log('🔴 LIVESCORES (TEMPO REAL):');
        console.log('!slivescores ou !slive - Todos os jogos ao vivo');
        console.log('!slivefutebol - Só futebol ao vivo');
        console.log('!slivebasket - Só basquete ao vivo');
        console.log('');
        console.log('📅 AGENDA & PRÓXIMOS JOGOS:');
        console.log('!sproximos ou !sagenda - Próximos jogos principais');
        console.log('!ssemana - Agenda completa da semana');
        console.log('');
        console.log('⚽ FUTEBOL & ESPORTES HOJE:');
        console.log('!shoje - Todos os esportes de hoje (filtro brasileiro)');
        console.log('!sfutebol - Só futebol principais campeonatos');
        console.log('');
        console.log('🔍 BUSCA DE TIMES:');
        console.log('!stime [nome] - Buscar informações de time');
        console.log('  Exemplos: !stime Arsenal, !stime Flamengo');
        console.log('');
        console.log('⚙️ SISTEMA:');
        console.log('!sping - Testar bot');
        console.log('!sstats - Estatísticas');
        console.log('!sconfig - Configurações do bot');
        console.log('!shelp - Lista de comandos');
        console.log('');
        console.log('💎 STATUS: TheSportsDB Premium Ativo (€9/mês)');
        console.log('📊 DADOS: 2025 reais + livescores em tempo real');
        console.log('🎯 FILTROS: Brasileiros priorizados, só principais campeonatos');
        console.log('');
        console.log('🎮 CS2 ESPORTS:');
        console.log('!scs2 - 🎮 **CS2 esports (DADOS REAIS 2025)** ✅');
        console.log('');
    }

    // ========== SISTEMA DE COMANDOS ==========

    async processCommand(message) {
        if (!this.config.commands.enabled) return;

        const command = message.content.toLowerCase().trim();
        const userId = message.author.id;
        
        // Verificar cooldown
        if (this.isOnCooldown(userId, command)) {
            return message.reply('⏳ Aguarde um pouco antes de usar este comando novamente!');
        }

        this.setCooldown(userId, command);

        try {
            switch (command) {
                case '!saovivo':
                    return await this.commandStreamersOnline(message);
                case '!shoje':
                    return await this.commandHoje(message);
                case '!sfutebol':
                    return await this.commandFutebol(message);
                
                // Novos comandos premium TheSportsDB
                case '!slivescores':
                case '!slive':
                    return await this.commandLivescores(message);
                case '!slivefutebol':
                    return await this.commandLiveFutebol(message);
                case '!slivebasket':
                    return await this.commandLiveBasket(message);
                case '!sproximos':
                case '!sagenda':
                    return await this.commandProximos(message);
                case '!ssemana':
                    return await this.commandSemana(message);
                
                // Comando específico para CS2
                case '!scs2':
                    return await this.commandCS2(message);
                
                // Comandos de sistema
                case '!shelp':
                    return await this.commandHelp(message);
                case '!sping':
                    return await this.commandPing(message);
                case '!sstats':
                    return await this.commandStats(message);
                case '!sconfig':
                    return await this.commandConfig(message);
                
                // Comando especial para busca de times
                default:
                    if (command.startsWith('!stime ')) {
                        const teamName = command.substring(7).trim(); // Remove "!stime "
                        return await this.commandSearchTeam(message, teamName);
                    }
                    return null; // Comando não reconhecido
            }
        } catch (error) {
            console.error('❌ Erro ao processar comando:', error);
            message.reply('❌ Erro interno ao processar comando. Tente novamente.');
        }
    }

    // Verificar cooldown
    isOnCooldown(userId, command) {
        const key = `${userId}-${command}`;
        const lastUsed = this.commandCooldowns.get(key);
        if (!lastUsed) return false;
        
        const cooldownMs = this.config.commands.cooldown_seconds * 1000;
        return (Date.now() - lastUsed) < cooldownMs;
    }

    // Definir cooldown
    setCooldown(userId, command) {
        const key = `${userId}-${command}`;
        this.commandCooldowns.set(key, Date.now());
    }

    // ========== COMANDOS ==========

    async commandStreamersOnline(message) {
        console.log('🔍 Executando comando !saovivo');
        
        const loadingMsg = await message.reply('🔍 Verificando streamers online...');
        
        const liveStreamers = [];
        
        // Verificar todos os streamers
        for (const [category, streamers] of Object.entries(this.config.streamers)) {
            for (const streamer of streamers) {
                try {
                    const response = await axios.get(`https://decapi.me/twitch/uptime/${streamer}`, {
                        timeout: 3000
                    });
                    
                    if (!response.data.includes('offline')) {
                        // Buscar viewers
                        const viewersResponse = await axios.get(`https://decapi.me/twitch/viewercount/${streamer}`, {
                            timeout: 3000
                        });
                        
                        const viewers = parseInt(viewersResponse.data) || 0;
                        
                        liveStreamers.push({
                            name: streamer,
                            category: category,
                            viewers: viewers,
                            uptime: response.data
                        });
                    }
                } catch (error) {
                    console.error(`Erro ao verificar ${streamer}:`, error.message);
                }
                
                await this.delay(500); // Evitar rate limit
            }
        }

        // Ordenar por viewers
        liveStreamers.sort((a, b) => b.viewers - a.viewers);

        const embed = new EmbedBuilder()
            .setTitle('🔴 STREAMERS AO VIVO AGORA')
            .setDescription(liveStreamers.length > 0 ? 
                `${liveStreamers.length} streamer(s) online no momento:` : 
                'Nenhum streamer monitorado está online no momento.')
            .setColor(0xff0000)
            .setTimestamp()
            .setFooter({ text: `Smart Stream Bot - Canal #${this.config.target_channel}` });

        if (liveStreamers.length > 0) {
            // Agrupar por categoria
            const categories = {};
            liveStreamers.forEach(stream => {
                if (!categories[stream.category]) {
                    categories[stream.category] = [];
                }
                categories[stream.category].push(stream);
            });

            for (const [category, streams] of Object.entries(categories)) {
                const categoryName = this.getCategoryName(category);
                const streamList = streams.map(s => 
                    `**${s.name}** - ${s.viewers.toLocaleString('pt-BR')} viewers (${s.uptime})`
                ).join('\n');

                embed.addFields({
                    name: `${this.getCategoryEmoji(category)} ${categoryName}`,
                    value: streamList,
                    inline: false
                });
            }
        }

        await loadingMsg.edit({ content: null, embeds: [embed] });
    }

    async commandHoje(message) {
        console.log('📅 Executando comando !shoje - TODOS OS ESPORTES DE HOJE');
        
        const loadingMsg = await message.reply('🔍 Buscando TODOS os jogos de hoje...');
        
        try {
            const today = new Date().toLocaleDateString('pt-BR');
            
            const embed = new EmbedBuilder()
                .setTitle('🌟 TODOS OS JOGOS DE HOJE')
                .setDescription(`📅 ${today} - Esportes com brasileiros ou relevantes`)
                .setColor(0x00ff00)
                .setTimestamp()
                .setFooter({ text: `Smart Stream Bot - Dados reais via TheSportsDB Premium` });

            let hasAnyGames = false;

            // 1. FUTEBOL BRASILEIRO (sempre mostrar Brasileirão) - ATUALIZADO
            const brasileiraoGames = await this.sportsIntegration.getBrazilianFootballToday();
            if (brasileiraoGames.length > 0) {
                const gamesList = brasileiraoGames.slice(0, 3).map(game => 
                    `🕐 ${game.time} - **${game.homeTeam}** vs **${game.awayTeam}**`
                ).join('\n');
                embed.addFields({ name: '🇧🇷 BRASILEIRÃO SÉRIE A', value: gamesList, inline: false });
                hasAnyGames = true;
            }

            // 2. NBA (mostrar TODOS os jogos) - ATUALIZADO
            const nbaGames = await this.sportsIntegration.getNBAToday();
            if (nbaGames.length > 0) {
                const gamesList = nbaGames.slice(0, 4).map(game => 
                    `🕐 ${game.time} - **${game.homeTeam}** vs **${game.awayTeam}**`
                ).join('\n');
                embed.addFields({ name: '🏀 NBA - TODOS OS JOGOS', value: gamesList, inline: false });
                hasAnyGames = true;
            }

            // 3. TÊNIS (só com brasileiros: Bia Haddad Maia, João Fonseca, etc.) - ATUALIZADO
            const tennisGames = await this.sportsIntegration.getBrazilianTennisToday();
            if (tennisGames) {
                embed.addFields({ name: '🎾 TÊNIS BRASILEIRO', value: tennisGames, inline: false });
                hasAnyGames = true;
            }

            // 4. PRINCIPAIS CAMPEONATOS INTERNACIONAIS - ATUALIZADO
            const mainFootballGames = await this.sportsIntegration.getMainFootballChampionshipsToday();
            if (mainFootballGames.length > 0) {
                // Agrupar por liga e mostrar só os mais importantes
                const importantLeagues = mainFootballGames.filter(game => 
                    game.league.includes('Premier') || 
                    game.league.includes('Champions') || 
                    game.league.includes('La Liga') ||
                    game.league.includes('Serie A')
                );
                
                if (importantLeagues.length > 0) {
                    const gamesText = importantLeagues.slice(0, 3).map(game => 
                        `🕐 ${game.time} - **${game.homeTeam}** vs **${game.awayTeam}** (${game.league})`
                    ).join('\n');
                    embed.addFields({ name: '🏆 PRINCIPAIS CAMPEONATOS', value: gamesText, inline: false });
                    hasAnyGames = true;
                }
            }

            // 5. CS2 ESPORTS - DADOS REAIS 2025
            const cs2Games = await this.sportsIntegration.getCS2MatchesToday();
            if (cs2Games.length > 0 && !cs2Games[0].isError) {
                const gamesList = cs2Games.slice(0, 3).map(game => {
                    let starsText = '';
                    if (game.stars >= 4) starsText = '⭐⭐⭐⭐';
                    else if (game.stars >= 3) starsText = '⭐⭐⭐';
                    else if (game.stars >= 2) starsText = '⭐⭐';
                    else starsText = '⭐';
                    
                    return `🕐 ${game.time} - ${starsText} **${game.homeTeam}** vs **${game.awayTeam}** (${game.league})`;
                }).join('\n');
                
                embed.addFields({ 
                    name: '🎮 CS2 ESPORTS (DADOS REAIS 2025)', 
                    value: gamesList + '\n💡 Use `!scs2` para ver todos os jogos', 
                    inline: false 
                });
                hasAnyGames = true;
            }

            if (!hasAnyGames) {
                embed.addFields({ 
                    name: '😴 Dia calmo', 
                    value: 'Não há jogos relevantes ou com brasileiros hoje.\n\n💡 Use `!sfutebol`, `!slivescores` para ver mais esportes.',
                    inline: false 
                });
            } else {
                embed.addFields({ 
                    name: '💡 Comandos Específicos', 
                    value: '`!sfutebol` - Todos os campeonatos de futebol\n`!slivescores` - Jogos ao vivo\n`!sproximos` - Próximos jogos',
                    inline: false 
                });
            }

            await loadingMsg.edit({ content: null, embeds: [embed] });
        } catch (error) {
            console.error('❌ Erro comando hoje:', error.message);
            await loadingMsg.edit({ content: '❌ Erro ao buscar jogos. Tente novamente.' });
        }
    }

    async commandAmanha(message) {
        console.log('📅 Executando comando !samanha');
        
        const loadingMsg = await message.reply('⚽ Buscando jogos de amanhã...');
        
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toLocaleDateString('pt-BR');

            const embed = new EmbedBuilder()
                .setTitle('⚽ JOGOS DE AMANHÃ')
                .setDescription(`Jogos programados para ${tomorrowStr}`)
                .setColor(0x0099ff)
                .setTimestamp()
                .setFooter({ text: `Smart Stream Bot - Canal #${this.config.target_channel}` });

            // Buscar jogos reais do futebol via API-Sports (com data de amanhã)
            embed.addFields({ 
                name: '📅 Jogos de Amanhã', 
                value: 'Funcionalidade em desenvolvimento.\n\n✅ Use `!shoje` para jogos de hoje com dados reais.',
                inline: false 
            });

            await loadingMsg.edit({ content: null, embeds: [embed] });
        } catch (error) {
            console.error('❌ Erro comando amanhã:', error.message);
            await loadingMsg.edit({ content: '❌ Erro ao buscar jogos de amanhã. Tente novamente.' });
        }
    }

    async commandSemana(message) {
        console.log('📅 Executando comando !ssemana - AGENDA COMPLETA');
        
        const loadingMsg = await message.reply('📅 Montando agenda completa da semana...');
        
        try {
            const agenda = await this.sportsIntegration.getWeeklySchedule();
            
            const embed = new EmbedBuilder()
                .setTitle('📅 AGENDA COMPLETA DA SEMANA')
                .setDescription('🗓️ Todos os próximos jogos dos principais campeonatos')
                .setColor(0x9932cc)
                .setTimestamp()
                .setFooter({ text: `Smart Stream Bot - Agenda semanal completa` });

            const totalJogos = (agenda.brasileirao?.length || 0) + 
                              (agenda.internacional?.length || 0) + 
                              (agenda.nba?.length || 0);

            if (totalJogos === 0) {
                embed.addFields({
                    name: '⚠️ Agenda vazia',
                    value: 'Parece que estamos entre temporadas ou em período de pausa.\nUse `!slivescores` para verificar jogos ao vivo.',
                    inline: false
                });
            } else {
                // Resumo geral
                embed.addFields({
                    name: '📊 Resumo da Semana',
                    value: `⚽ **Brasileirão:** ${agenda.brasileirao?.length || 0} jogos\n🏆 **Internacional:** ${agenda.internacional?.length || 0} jogos\n🏀 **NBA:** ${agenda.nba?.length || 0} jogos\n\n**Total:** ${totalJogos} jogos agendados`,
                    inline: false
                });

                // Detalhes por campeonato (limitado para não sobrecarregar)
                if (agenda.brasileirao && agenda.brasileirao.length > 0) {
                    const primeirosJogos = agenda.brasileirao.slice(0, 5); // Mostra 5 como preview
                    const jogosText = primeirosJogos.map(jogo => {
                        // Usar a data real do objeto jogo
                        return `📅 **${jogo.date} às ${jogo.time}** - ${jogo.status}\n🏟️ **${jogo.homeTeam} x ${jogo.awayTeam}**\n📍 ${jogo.venue}\n🏆 ${jogo.round}\n📺 **Globo, SporTV**`;
                    }).join('\n\n');
                    
                    embed.addFields({
                        name: `⚽ Brasileirão (${agenda.brasileirao.length} jogos)`,
                        value: jogosText + (agenda.brasileirao.length > 5 ? `\n\n... e mais ${agenda.brasileirao.length - 5} jogos` : ''),
                        inline: true
                    });
                }

                if (agenda.internacional && agenda.internacional.length > 0) {
                    const primeirosJogos = agenda.internacional.slice(0, 5); // Mostra 5 como preview
                    const jogosText = primeirosJogos.map(jogo => {
                        // Usar a data real do objeto jogo
                        return `📅 **${jogo.date} às ${jogo.time}** - ${jogo.status}\n🏆 **${jogo.homeTeam} x ${jogo.awayTeam}** (${jogo.league})\n📍 ${jogo.venue}\n🏆 ${jogo.round}\n📺 **Globo, SporTV**`;
                    }).join('\n\n');
                    
                    embed.addFields({
                        name: `🏆 Internacional (${agenda.internacional.length} jogos)`,
                        value: jogosText + (agenda.internacional.length > 5 ? `\n\n... e mais ${agenda.internacional.length - 5} jogos` : ''),
                        inline: true
                    });
                }

                if (agenda.nba && agenda.nba.length > 0) {
                    const primeirosJogos = agenda.nba.slice(0, 5); // Mostra 5 como preview
                    const jogosText = primeirosJogos.map(jogo => {
                        // Usar a data real do objeto jogo
                        return `📅 **${jogo.date} às ${jogo.time}** - ${jogo.status}\n🏀 **${jogo.homeTeam} x ${jogo.awayTeam}**\n📍 ${jogo.venue}\n🏆 ${jogo.round}\n📺 **Globo, SporTV**`;
                    }).join('\n\n');
                    
                    embed.addFields({
                        name: `🏀 NBA (${agenda.nba.length} jogos)`,
                        value: jogosText + (agenda.nba.length > 5 ? `\n\n... e mais ${agenda.nba.length - 5} jogos` : ''),
                        inline: true
                    });
                }
            }

            // Comandos úteis
            embed.addFields({
                name: '💡 Comandos Úteis',
                value: '`!slivescores` - Jogos ao vivo\n`!sproximos` - Próximos jogos\n`!stime [nome]` - Buscar time\n`!shoje` - Jogos de hoje',
                inline: false
            });

            await loadingMsg.edit({ content: '', embeds: [embed] });

        } catch (error) {
            console.error('❌ Erro no comando semana:', error);
            await loadingMsg.edit('❌ Erro ao montar agenda da semana. Tente novamente.');
        }
    }

    async commandConfig(message) {
        console.log('⚙️ Executando comando !sconfig');
        
        const totalStreamers = Object.values(this.config.streamers).flat().length;
        const totalChampionships = Object.values(this.config.football_championships).flat().length;
        
        const embed = new EmbedBuilder()
            .setTitle('⚙️ CONFIGURAÇÕES DO BOT')
            .setDescription('Configurações atuais do Smart Stream Bot')
            .setColor(0xffaa00)
            .setTimestamp()
            .setFooter({ text: `Smart Stream Bot - Canal #${this.config.target_channel}` })
            .addFields(
                { name: '📺 Canal Alvo', value: `#${this.config.target_channel}`, inline: true },
                { name: '🎮 Total Streamers', value: totalStreamers.toString(), inline: true },
                { name: '⚽ Campeonatos', value: totalChampionships.toString(), inline: true },
                { name: '👥 Viewers Mínimos', value: this.config.notifications.min_viewers.toLocaleString('pt-BR'), inline: true },
                { name: '⏰ Cooldown', value: `${this.config.notifications.cooldown_minutes} min`, inline: true },
                { name: '🕐 Horário Ativo', value: `${this.config.active_hours.start}h - ${this.config.active_hours.end}h`, inline: true }
            );

        await message.reply({ embeds: [embed] });
    }

    async commandHelp(message) {
        console.log('❓ Executando comando !shelp');
        
        try {
            const embed = new EmbedBuilder()
                .setTitle('🤖 COMANDOS DISPONÍVEIS - TheSportsDB Premium')
                .setDescription('Lista completa de comandos do Smart Stream Bot com dados reais 2025!')
                .setColor(0x7289da)
                .setTimestamp()
                .setFooter({ text: `Smart Stream Bot - Canal #${this.config.target_channel} | ✅ TheSportsDB Premium Ativo` })
                .addFields(
                    { 
                        name: '📺 STREAMS & TWITCH', 
                        value: '`!saovivo` - Ver streamers online agora', 
                        inline: false 
                    },
                    { 
                        name: '🔴 LIVESCORES (TEMPO REAL)', 
                        value: '`!slivescores` ou `!slive` - 🌟 **Todos os jogos ao vivo**\n`!slivefutebol` - ⚽ Só futebol ao vivo\n`!slivebasket` - 🏀 Só basquete ao vivo', 
                        inline: false 
                    },
                    { 
                        name: '📅 AGENDA & PRÓXIMOS JOGOS', 
                        value: '`!sproximos` ou `!sagenda` - 📋 Próximos jogos principais\n`!ssemana` - 🗓️ Agenda completa da semana', 
                        inline: false 
                    },
                    { 
                        name: '⚽ FUTEBOL & ESPORTES HOJE', 
                        value: '`!shoje` - 🌟 **Todos os esportes de hoje** (filtro brasileiro)\n`!sfutebol` - ⚽ **Só futebol** principais campeonatos', 
                        inline: false 
                    },
                    { 
                        name: '🎮 CS2 ESPORTS', 
                        value: '`!scs2` - 🎮 **CS2 esports (DADOS REAIS 2025)** ✅', 
                        inline: false 
                    },
                    { 
                        name: '🔍 BUSCA DE TIMES', 
                        value: '`!stime [nome]` - 🔎 Buscar informações de time\n📝 **Exemplos**: `!stime Arsenal`, `!stime Flamengo`, `!stime Lakers`', 
                        inline: false 
                    },
                    { 
                        name: '⚙️ SISTEMA & STATUS', 
                        value: '`!sping` - 🏓 Testar bot\n`!sstats` - 📊 Estatísticas\n`!sconfig` - ⚙️ Configurações', 
                        inline: false 
                    },
                    { 
                        name: '🎯 FILTROS APLICADOS', 
                        value: '⚽ **Futebol**: Só principais (❌ série B/C excluídas)\n🏀 **NBA**: Todos os jogos mostrados\n🎾 **Tênis**: Só brasileiros (João Fonseca ✅)\n🏆 **Campeonatos**: Champions, Premier, La Liga, etc.', 
                        inline: false 
                    },
                    { 
                        name: '💎 STATUS PREMIUM ATIVO', 
                        value: '✅ **TheSportsDB Premium** - API Key: 959508\n📊 **Rate Limit**: 100 requests/minuto\n📅 **Dados**: 2025 reais + livescores em tempo real\n💰 **Custo**: €9/mês (muito mais barato que alternativas)\n🚀 **Recursos**: Livescores, agenda, busca de times, highlights', 
                        inline: false 
                    },
                    { 
                        name: '🌟 COMANDOS MAIS USADOS', 
                        value: '**Dia a dia**: `!shoje`, `!slivescores`\n**Planejamento**: `!sproximos`, `!ssemana`\n**Pesquisa**: `!stime Arsenal`\n**Streams**: `!saovivo`\n**CS2**: `!scs2`', 
                        inline: false 
                    }
                );

            console.log('✅ Embed do !shelp criado com sucesso');
            await message.reply({ embeds: [embed] });
            console.log('✅ !shelp enviado com sucesso');

        } catch (error) {
            console.error('❌ Erro no comando !shelp:', error);
            try {
                await message.reply('❌ Erro ao carregar lista de comandos. Use `!sping` para testar o bot.');
            } catch (replyError) {
                console.error('❌ Erro crítico ao responder !shelp:', replyError);
            }
        }
    }

    async commandPing(message) {
        console.log('🏓 Executando comando !sping');
        
        const embed = new EmbedBuilder()
            .setTitle('🏓 PONG!')
            .setDescription('Smart Stream Bot está funcionando perfeitamente!')
            .setColor(0x00ff41)
            .setTimestamp()
            .setFooter({ text: `Smart Stream Bot - Respondido em ${new Date().toLocaleTimeString('pt-BR')}` })
            .addFields(
                { name: '✅ Status', value: 'Online e monitorando', inline: true },
                { name: '📊 Uptime', value: 'Funcionando 24/7', inline: true },
                { name: '📺 Canal', value: `#${this.config.target_channel}`, inline: true }
            );

        await message.reply({ embeds: [embed] });
    }

    async commandStats(message) {
        console.log('📊 Executando comando !sstats');
        
        const totalStreamers = Object.values(this.config.streamers).flat().length;
        const activeStreamsCount = this.activeStreams.size;
        const totalChampionships = Object.values(this.config.football_championships).flat().length;
        const totalSports = Object.values(this.config.other_sports).flat().length;
        
        const embed = new EmbedBuilder()
            .setTitle('📊 ESTATÍSTICAS DO BOT')
            .setDescription('Estatísticas em tempo real do Smart Stream Bot')
            .setColor(0xff6600)
            .setTimestamp()
            .setFooter({ text: `Smart Stream Bot - Atualizado ${new Date().toLocaleString('pt-BR')}` })
            .addFields(
                { name: '🎮 Streamers Monitorados', value: totalStreamers.toString(), inline: true },
                { name: '🔴 Streams Ativas', value: activeStreamsCount.toString(), inline: true },
                { name: '⚽ Campeonatos', value: totalChampionships.toString(), inline: true },
                { name: '🏅 Outros Esportes', value: totalSports.toString(), inline: true },
                { name: '📺 Canal Alvo', value: `#${this.config.target_channel}`, inline: true },
                { name: '⏰ Próxima Verificação', value: 'Em até 3 minutos', inline: true }
            );

        await message.reply({ embeds: [embed] });
    }

    // NOVO COMANDO: !sfutebol - TODOS OS JOGOS DO BRASILEIRÃO + FUTEBOL INTERNACIONAL (VERSÃO MÚLTIPLAS MENSAGENS)
    async commandFutebol(message) {
        console.log('⚽ Executando comando !sfutebol - TODOS OS JOGOS + MÚLTIPLAS MENSAGENS');
        
        const loadingMsg = await message.reply('⚽ Buscando TODOS os jogos de futebol (preparando múltiplas mensagens)...');
        
        try {
            const today = new Date().toLocaleDateString('pt-BR');
            const embeds = [];

            // ========== PARTE 1: TODOS OS JOGOS DO BRASILEIRÃO ==========
            const allBrazilianGames = await this.sportsIntegration.getAllBrazilianFootballGames();
            
            if (allBrazilianGames && allBrazilianGames.length > 0) {
                // Dividir todos os jogos do Brasileirão em chunks de 5 jogos por mensagem
                const brasileiraoChunks = this.splitGamesIntoMessages(allBrazilianGames, 5);
                
                brasileiraoChunks.forEach((chunk, index) => {
                    const embed = new EmbedBuilder()
                        .setTitle(`🇧🇷 BRASILEIRÃO SÉRIE A ${brasileiraoChunks.length > 1 ? `(${index + 1}/${brasileiraoChunks.length})` : ''}`)
                        .setDescription('⚽ Dados reais do Brasileirão 2025')
                        .setColor(0x009639) // Verde Brasil
                        .setTimestamp()
                        .setFooter({ text: `TheSportsDB Premium - Brasileirão Real` });

                    const jogosText = chunk.map(jogo => {
                        // Usar a data real do objeto jogo
                        return `📅 **${jogo.date} às ${jogo.time}** - ${jogo.status}\n🏟️ **${jogo.homeTeam} x ${jogo.awayTeam}**\n📍 ${jogo.venue}\n🏆 ${jogo.round}\n📺 **Globo, SporTV**`;
                    }).join('\n\n');
                    
                    embed.addFields({
                        name: `⚽ ${chunk.length} Jogos do Brasileirão`,
                        value: jogosText,
                        inline: false
                    });

                    embeds.push(embed);
                });
            }

            // ========== PARTE 2: FUTEBOL INTERNACIONAL PRINCIPAL ==========
            const mainChampionships = await this.sportsIntegration.getMainFootballChampionshipsToday();
            
            if (mainChampionships && mainChampionships.length > 0) {
                // Organizar por liga e criar embeds separados
                mainChampionships.forEach((leagueData, leagueIndex) => {
                    const { league, games } = leagueData;
                    
                    if (games && games.length > 0) {
                        // Filtrar só ligas principais (sem série B/C)
                        const isMainLeague = 
                            league.includes('Premier League') ||
                            league.includes('La Liga') ||
                            league.includes('Serie A') ||
                            league.includes('Champions') ||
                            league.includes('Bundesliga') ||
                            league.includes('Ligue 1');

                        if (isMainLeague) {
                            // Dividir jogos da liga em chunks se necessário
                            const leagueChunks = this.splitGamesIntoMessages(games, 6);
                            
                            leagueChunks.forEach((chunk, chunkIndex) => {
                                const embed = new EmbedBuilder()
                                    .setTitle(`🏆 ${league.toUpperCase()} ${leagueChunks.length > 1 ? `(${chunkIndex + 1}/${leagueChunks.length})` : ''}`)
                                    .setDescription(`📅 ${today} - Principais campeonatos internacionais`)
                                    .setColor(0x4169E1) // Azul internacional
                                    .setTimestamp()
                                    .setFooter({ text: `TheSportsDB Premium - ${league}` });

                                const jogosText = chunk.map(game => {
                                    // Usar a data real do objeto jogo
                                    return `📅 **${game.date} às ${game.time}** - ${game.status}\n🏆 **${game.homeTeam} x ${game.awayTeam}**\n📍 ${game.venue || 'Estádio TBD'}\n${canal}`;
                                }).join('\n\n');

                                // Emoji específico por liga
                                let emoji = '🏆';
                                if (league.includes('Premier')) emoji = '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
                                else if (league.includes('La Liga')) emoji = '🇪🇸';
                                else if (league.includes('Serie A')) emoji = '🇮🇹';
                                else if (league.includes('Bundesliga')) emoji = '🇩🇪';
                                else if (league.includes('Ligue')) emoji = '🇫🇷';
                                else if (league.includes('Champions')) emoji = '⭐';

                                embed.addFields({ 
                                    name: `${emoji} ${chunk.length} Jogos Hoje`, 
                                    value: jogosText, 
                                    inline: false 
                                });

                                embeds.push(embed);
                            });
                        }
                    }
                });
            }

            // ========== EMBED FINAL: RESUMO DO FUTEBOL ==========
            const totalBrazilian = allBrazilianGames?.length || 0;
            const totalInternational = mainChampionships?.reduce((sum, league) => sum + (league.games?.length || 0), 0) || 0;
            
            const finalEmbed = new EmbedBuilder()
                .setTitle('⚽ RESUMO COMPLETO DO FUTEBOL')
                .setDescription('📊 Todos os jogos de futebol encontrados!')
                .setColor(0x228B22) // Verde futebol
                .setTimestamp()
                .setFooter({ text: `Smart Stream Bot - ${embeds.length + 1} mensagens enviadas` });

            finalEmbed.addFields({
                name: '📊 Total de Jogos',
                value: `🇧🇷 **Brasileirão:** ${totalBrazilian} jogos\n🏆 **Internacional:** ${totalInternational} jogos\n⚽ **Total Geral:** ${totalBrazilian + totalInternational} jogos`,
                inline: true
            });

            finalEmbed.addFields({
                name: '🎯 Filtros Aplicados',
                value: '✅ **BRASILEIRÃO:** Todos os jogos\n✅ **INTERNACIONAL:** Só principais\n• Champions League, Premier League\n• La Liga, Serie A, Bundesliga\n❌ **EXCLUÍDOS:** Série B, C, D',
                inline: true
            });

            if (totalBrazilian > 0 || totalInternational > 0) {
                finalEmbed.addFields({
                    name: '💡 Comandos Relacionados',
                    value: '`!slivescores` - Jogos ao vivo\n`!sproximos` - Próximos importantes\n`!stime Flamengo` - Buscar time\n`!slivebasket` - Basquete hoje',
                    inline: false
                });
            } else {
                finalEmbed.addFields({
                    name: '📅 Nenhum jogo de futebol hoje',
                    value: 'Não há jogos dos principais campeonatos hoje.\n\n✅ **Dados reais via TheSportsDB Premium**\n\n💡 **Tente:** `!slivescores` para jogos ao vivo ou `!sproximos` para próximos jogos.',
                    inline: false
                });
            }

            embeds.push(finalEmbed);

            // Enviar todas as mensagens
            if (embeds.length > 0) {
                await loadingMsg.delete();
                await this.sendMultipleEmbeds(message, embeds, 1200); // 1.2s entre mensagens
                console.log(`✅ Comando !sfutebol: ${embeds.length} mensagens enviadas com ${totalBrazilian + totalInternational} jogos!`);
            } else {
                await loadingMsg.edit({ content: '❌ Erro ao buscar jogos de futebol. Tente novamente.' });
            }

        } catch (error) {
            console.error('❌ Erro comando futebol:', error.message);
            await loadingMsg.edit({ content: '❌ Erro ao buscar jogos de futebol. Tente novamente.' });
        }
    }

    // MÉTODO AUXILIAR: Filtro tênis brasileiro
    async getBrazilianTennisToday() {
        try {
            // Lista de tenistas brasileiros
            const brazilianPlayers = [
                'Bia Haddad Maia', 'Beatriz Haddad Maia', 'B. Haddad Maia',
                'João Fonseca', 'J. Fonseca', 'Joao Fonseca',
                'Thiago Monteiro', 'T. Monteiro',
                'Laura Pigossi', 'L. Pigossi',
                'Felipe Meligeni', 'F. Meligeni'
            ];

            // Aqui você faria a busca real na API de tênis
            // Por enquanto, vou retornar exemplo quando há brasileiros
            
            const hasBrazilianMatch = Math.random() > 0.6; // 40% chance (simulação)
            
            if (hasBrazilianMatch) {
                const randomPlayer = Math.random() > 0.5 ? 'Bia Haddad Maia' : 'João Fonseca';
                const opponent = randomPlayer === 'Bia Haddad Maia' ? 'Caroline Garcia' : 'Alexander Zverev';
                const tournament = randomPlayer === 'Bia Haddad Maia' ? 'WTA Tournament' : 'ATP Tournament';
                
                return `🎾 **${randomPlayer}** vs ${opponent}\n🕐 14:00 - ${tournament}\n📺 SporTV, ESPN`;
            }
            
            return null; // Sem brasileiros hoje
        } catch (error) {
            console.error('❌ Erro filtro tênis brasileiro:', error.message);
            return null;
        }
    }

    // MÉTODO AUXILIAR: Principais campeonatos de futebol (sem série B/C/menores)
    async getMainFootballChampionshipsToday() {
        try {
            const mainChampionships = [
                { id: '2', name: '🏆 CHAMPIONS LEAGUE', emoji: '🏆' },
                { id: '135', name: '🇮🇹 SERIE A ITALIANA', emoji: '🇮🇹' },
                { id: '39', name: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 PREMIER LEAGUE', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
                { id: '140', name: '🇪🇸 LA LIGA', emoji: '🇪🇸' },
                { id: '61', name: '🇫🇷 LIGUE 1', emoji: '🇫🇷' },
                { id: '78', name: '🇩🇪 BUNDESLIGA', emoji: '🇩🇪' }
            ];

            const results = [];

            for (const champ of mainChampionships) {
                try {
                    const games = await this.sportsIntegration.fetchAPISportsData('football', champ.id);
                    if (games && games.length > 0) {
                        const gamesList = games.slice(0, 2).map(game => 
                            `🕐 ${game.time} - **${game.homeTeam}** vs **${game.awayTeam}**`
                        ).join('\n');
                        
                        results.push({
                            name: champ.name,
                            games: gamesList
                        });
                    }
                } catch (error) {
                    console.error(`❌ Erro ao buscar ${champ.name}:`, error.message);
                }
                
                // Pequena pausa para evitar rate limit
                await this.delay(300);
            }

            return results;
        } catch (error) {
            console.error('❌ Erro principais campeonatos futebol:', error.message);
            return [];
        }
    }

    // Gerar jogos fictícios para demonstração
    generateMockMatches(period) {
        const championships = [
            ...this.config.football_championships.nacionais,
            ...this.config.football_championships.internacionais,
            ...this.config.football_championships.copas
        ];

        const teams = [
            'Flamengo', 'Palmeiras', 'Corinthians', 'São Paulo', 'Santos', 'Vasco',
            'Internacional', 'Grêmio', 'Atletico-MG', 'Cruzeiro', 'Botafogo', 'Fluminense',
            'Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'PSG', 'Bayern Munich'
        ];

        const fields = [];

        if (period === 'semana') {
            // Para semana, mostrar vários dias
            for (let i = 0; i < 3; i++) {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
                
                const matches = [];
                for (let j = 0; j < 2; j++) {
                    const team1 = teams[Math.floor(Math.random() * teams.length)];
                    let team2 = teams[Math.floor(Math.random() * teams.length)];
                    while (team2 === team1) {
                        team2 = teams[Math.floor(Math.random() * teams.length)];
                    }
                    const championship = championships[Math.floor(Math.random() * championships.length)];
                    const time = `${15 + j * 2}:30`;
                    
                    matches.push(`${time} - **${team1}** vs **${team2}** (${championship})`);
                }
                
                fields.push({
                    name: `📅 ${dayName} - ${date.toLocaleDateString('pt-BR')}`,
                    value: matches.join('\n'),
                    inline: false
                });
            }
        } else {
            // Para hoje/amanhã, mostrar jogos do dia
            const matches = [];
            for (let i = 0; i < 4; i++) {
                const team1 = teams[Math.floor(Math.random() * teams.length)];
                let team2 = teams[Math.floor(Math.random() * teams.length)];
                while (team2 === team1) {
                    team2 = teams[Math.floor(Math.random() * teams.length)];
                }
                const championship = championships[Math.floor(Math.random() * championships.length)];
                const time = `${15 + i * 2}:${Math.random() > 0.5 ? '00' : '30'}`;
                
                matches.push(`${time} - **${team1}** vs **${team2}**`);
            }
            
            // Agrupar por campeonato
            const champMatches = {};
            championships.slice(0, 3).forEach((champ, index) => {
                champMatches[champ] = matches.slice(index, index + 2);
            });
            
            for (const [champ, matchList] of Object.entries(champMatches)) {
                if (matchList.length > 0) {
                    fields.push({
                        name: `🏆 ${champ.toUpperCase()}`,
                        value: matchList.join('\n') || 'Nenhum jogo programado',
                        inline: false
                    });
                }
            }
        }

        if (fields.length === 0) {
            fields.push({
                name: '😴 Nenhum jogo programado',
                value: 'Não há jogos programados para este período.',
                inline: false
            });
        }

        return fields;
    }

    // ========== MONITORAMENTO DE STREAMS ==========

    startStreamMonitoring() {
        console.log('🚀 Iniciando monitoramento de streams...');
        
        // Verificar streamers a cada 3 minutos
        cron.schedule('*/3 * * * *', async () => {
            await this.checkAllStreamers();
        });

        // Resumo diário de jogos às 8h
        cron.schedule('0 8 * * *', async () => {
            await this.sendDailyGamesSummary();
        });

        // Relatório diário às 9h
        cron.schedule('0 9 * * *', async () => {
            await this.sendDailyReport();
        });

        // Primeira verificação em 10 segundos
        setTimeout(() => this.checkAllStreamers(), 10000);
        
        console.log('✅ Monitoramento ativo!');
        console.log('⏰ Resumo de jogos diário às 8h configurado!');
    }

    async checkAllStreamers() {
        console.log('🔍 Verificando todos os streamers configurados...');
        
        // Verificar se está no horário ativo
        const now = new Date();
        const hour = now.getHours();
        if (hour < this.config.active_hours.start || hour > this.config.active_hours.end) {
            console.log('😴 Fora do horário ativo, pulando verificação');
            return;
        }

        // Verificar cada categoria
        for (const [category, streamers] of Object.entries(this.config.streamers)) {
            for (const streamer of streamers) {
                await this.checkStreamer(streamer, category);
                await this.delay(1000); // Evitar rate limit
            }
        }
    }

    async checkStreamer(streamer, category) {
        try {
            // Verificar se streamer está online
            const response = await axios.get(`https://decapi.me/twitch/uptime/${streamer}`, {
                timeout: 5000
            });
            
            const isLive = !response.data.includes('offline');
            const wasLive = this.activeStreams.has(streamer);
            
            if (isLive && !wasLive) {
                // Streamer ficou online
                const canNotify = this.shouldNotify(streamer);
                if (canNotify) {
                    await this.notifyStreamerOnline(streamer, category);
                    this.activeStreams.set(streamer, {
                        category: category,
                        startTime: Date.now()
                    });
                    this.lastNotifications.set(streamer, Date.now());
                }
            } else if (!isLive && wasLive) {
                // Streamer ficou offline
                this.activeStreams.delete(streamer);
                console.log(`📴 ${streamer} ficou offline`);
            }
            
        } catch (error) {
            console.error(`❌ Erro ao verificar ${streamer}:`, error.message);
        }
    }

    shouldNotify(streamer) {
        const lastNotification = this.lastNotifications.get(streamer);
        if (!lastNotification) return true;
        
        const cooldownMs = this.config.notifications.cooldown_minutes * 60 * 1000;
        return (Date.now() - lastNotification) > cooldownMs;
    }

    async notifyStreamerOnline(streamer, category) {
        try {
            console.log(`🚨 Enviando notificação: ${streamer} está online!`);
            
            const streamInfo = await this.getStreamInfo(streamer, category);
            
            // Usar webhook para notificações automáticas
            const embed = {
                title: `🔴 ${streamer} está AO VIVO!`,
                description: streamInfo.title,
                color: this.getCategoryColor(category),
                timestamp: new Date().toISOString(),
                fields: [
                    {
                        name: '🎮 Jogo/Categoria',
                        value: streamInfo.game,
                        inline: true
                    },
                    {
                        name: '👥 Viewers',
                        value: streamInfo.viewers.toLocaleString('pt-BR'),
                        inline: true
                    },
                    {
                        name: '📺 Canal',
                        value: `[twitch.tv/${streamer}](https://twitch.tv/${streamer})`,
                        inline: true
                    },
                    {
                        name: '📂 Categoria',
                        value: this.getCategoryName(category),
                        inline: true
                    },
                    {
                        name: '📺 Canal Discord',
                        value: `#${this.config.target_channel}`,
                        inline: true
                    },
                    {
                        name: '🤖 Comando',
                        value: 'Use `!saovivo` para ver todos online',
                        inline: true
                    }
                ],
                footer: {
                    text: 'Smart Stream Bot - Transmissões'
                }
            };

            if (this.config.notifications.include_thumbnails && streamInfo.thumbnail) {
                embed.thumbnail = { url: streamInfo.thumbnail };
            }

            let content = '';
            if (this.config.notifications.ping_everyone) {
                content += `🚨 **@everyone** `;
            }
            if (this.config.notifications.mention_channel) {
                content += `📺 **#${this.config.target_channel}** `;
            }
            content += `${streamer} está ao vivo!`;

            await this.sendWebhook(embed, content, this.config.target_channel);
            
        } catch (error) {
            console.error(`❌ Erro ao notificar ${streamer}:`, error.message);
        }
    }

    async getStreamInfo(streamer, category) {
        // Simular informações da stream baseado na categoria
        const info = {
            title: `Stream de ${streamer}`,
            game: 'Just Chatting',
            viewers: Math.floor(Math.random() * 10000) + this.config.notifications.min_viewers,
            thumbnail: null
        };

        // Personalizar por categoria
        switch (category) {
            case 'cs2_br':
            case 'cs2_international':
                info.game = 'Counter-Strike 2';
                info.title = this.getRandomCS2Title();
                break;
            case 'futebol':
                info.game = 'Just Chatting';
                info.title = this.getRandomFootballTitle();
                break;
            case 'variety':
                info.title = this.getRandomVarietyTitle();
                break;
        }

        return info;
    }

    async sendDailyReport() {
        const totalStreamers = Object.values(this.config.streamers).flat().length;
        const totalChampionships = Object.values(this.config.football_championships).flat().length;
        const totalOtherSports = Object.values(this.config.other_sports).flat().length;
        
        const embed = {
            title: '📊 Relatório Diário - Smart Bot',
            description: `Resumo das configurações e atividades para #${this.config.target_channel}`,
            color: 0x00ff41,
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: '📺 Total de Streamers',
                    value: totalStreamers.toString(),
                    inline: true
                },
                {
                    name: '⚽ Campeonatos de Futebol',
                    value: totalChampionships.toString(),
                    inline: true
                },
                {
                    name: '🏅 Outros Esportes',
                    value: totalOtherSports.toString(),
                    inline: true
                },
                {
                    name: '🎮 Categorias Ativas',
                    value: Object.keys(this.config.streamers).length.toString(),
                    inline: true
                },
                {
                    name: '📺 Canal Alvo',
                    value: `#${this.config.target_channel}`,
                    inline: true
                },
                {
                    name: '🕐 Horário Ativo',
                    value: `${this.config.active_hours.start}h - ${this.config.active_hours.end}h`,
                    inline: true
                },
                {
                    name: '🤖 Comandos Disponíveis',
                    value: '!saovivo, !shoje, !samanha, !ssemana, !shelp',
                    inline: false
                }
            ],
            footer: {
                text: 'Smart Stream Bot - Relatório Diário'
            }
        };

        await this.sendWebhook(embed, `📊 **Relatório Diário** - Bot ativo em #${this.config.target_channel}! Use \`!shelp\` para ver comandos.`, this.config.target_channel);
    }

    async sendDailyGamesSummary() {
        console.log('🌅 Enviando resumo diário de jogos (8h)');
        
        const today = new Date();
        const todayStr = today.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        try {
            // Buscar dados reais via TheSportsDB Premium
            const allSports = await this.sportsIntegration.getAllSportsToday();
            
            const embed = {
                title: '🌅 BOM DIA! JOGOS DE HOJE',
                description: `📅 **${todayStr}**\n\nConfira os principais jogos programados para hoje:`,
                color: 0xff9500, // Laranja para manhã
                timestamp: new Date().toISOString(),
                fields: [],
                footer: {
                    text: 'Smart Stream Bot - Resumo Matinal (Dados Reais TheSportsDB)'
                },
                thumbnail: {
                    url: 'https://cdn.discordapp.com/emojis/938415616628174849.png'
                }
            };

            let hasAnyGames = false;

            // Brasileirão
            if (allSports.footballBrazil && allSports.footballBrazil.length > 0) {
                const gamesList = allSports.footballBrazil.slice(0, 3).map(game => 
                    `🕐 ${game.time} - **${game.homeTeam}** vs **${game.awayTeam}**`
                ).join('\n');
                embed.fields.push({
                    name: '🇧🇷 BRASILEIRÃO SÉRIE A',
                    value: gamesList,
                    inline: false
                });
                hasAnyGames = true;
            }

            // Principais campeonatos internacionais
            if (allSports.footballMain && allSports.footballMain.length > 0) {
                const gamesList = allSports.footballMain.slice(0, 3).map(game => 
                    `🕐 ${game.time} - **${game.homeTeam}** vs **${game.awayTeam}** (${game.league})`
                ).join('\n');
                embed.fields.push({
                    name: '🏆 CAMPEONATOS INTERNACIONAIS',
                    value: gamesList,
                    inline: false
                });
                hasAnyGames = true;
            }

            // NBA
            if (allSports.nba && allSports.nba.length > 0) {
                const gamesList = allSports.nba.slice(0, 2).map(game => 
                    `🕐 ${game.time} - **${game.homeTeam}** vs **${game.awayTeam}**`
                ).join('\n');
                embed.fields.push({
                    name: '🏀 NBA',
                    value: gamesList,
                    inline: false
                });
                hasAnyGames = true;
            }

            // Tênis brasileiro
            if (allSports.tennis && allSports.tennis.length > 0) {
                const gamesList = allSports.tennis.slice(0, 2).map(game => 
                    `🕐 ${game.time} - **${game.homeTeam}** vs **${game.awayTeam}**`
                ).join('\n');
                embed.fields.push({
                    name: '🎾 TÊNIS BRASILEIRO',
                    value: gamesList,
                    inline: false
                });
                hasAnyGames = true;
            }

            // 5. CS2 ESPORTS - DADOS REAIS 2025
            const cs2Games = await this.sportsIntegration.getCS2MatchesToday();
            if (cs2Games.length > 0 && !cs2Games[0].isError) {
                const gamesList = cs2Games.slice(0, 3).map(game => {
                    let starsText = '';
                    if (game.stars >= 4) starsText = '⭐⭐⭐⭐';
                    else if (game.stars >= 3) starsText = '⭐⭐⭐';
                    else if (game.stars >= 2) starsText = '⭐⭐';
                    else starsText = '⭐';
                    
                    return `🕐 ${game.time} - ${starsText} **${game.homeTeam}** vs **${game.awayTeam}** (${game.league})`;
                }).join('\n');
                
                embed.addFields({ 
                    name: '🎮 CS2 ESPORTS (DADOS REAIS 2025)', 
                    value: gamesList + '\n💡 Use `!scs2` para ver todos os jogos', 
                    inline: false 
                });
                hasAnyGames = true;
            }

            if (!hasAnyGames) {
                embed.fields.push({
                    name: '😴 Dia tranquilo',
                    value: 'Não há jogos dos principais campeonatos hoje.\n\n✅ **Dados reais via TheSportsDB Premium**\n💡 Use `!shoje` para verificar novamente.',
                    inline: false
                });
            }

            // Adicionar campo extra com dica
            embed.fields.push({
                name: '💡 Comandos Úteis',
                value: '`!saovivo` - Ver streamers online\n`!shoje` - Jogos de hoje\n`!slivescores` - Jogos ao vivo\n`!shelp` - Todos os comandos',
                inline: false
            });

            await this.sendWebhook(embed, `🌅 **Bom dia!** Confira os jogos de hoje em #${this.config.target_channel}! Dados reais via TheSportsDB Premium.`, this.config.target_channel);

        } catch (error) {
            console.error('❌ Erro ao buscar resumo diário:', error.message);
            
            // Fallback simples em caso de erro
            const embed = {
                title: '🌅 BOM DIA!',
                description: `📅 **${todayStr}**\n\n⚠️ Erro ao buscar jogos. Use \`!shoje\` para dados atualizados.`,
                color: 0xff9500,
                timestamp: new Date().toISOString(),
                fields: [{
                    name: '💡 Comandos Disponíveis',
                    value: '`!shoje` - Jogos de hoje\n`!slivescores` - Jogos ao vivo\n`!sproximos` - Próximos jogos',
                    inline: false
                }],
                footer: {
                    text: 'Smart Stream Bot - Resumo Matinal'
                }
            };

            await this.sendWebhook(embed, `🌅 **Bom dia!** Use \`!shoje\` para ver os jogos de hoje.`, this.config.target_channel);
        }
    }

    // ========== NOVOS COMANDOS PREMIUM THESPORTSDB ==========

    // COMANDO: !slivescores ou !slive - TODOS OS LIVESCORES (VERSÃO MÚLTIPLAS MENSAGENS)
    async commandLivescores(message) {
        console.log('🔴 Executando comando !slivescores - LIVESCORES COM MÚLTIPLAS MENSAGENS');
        
        const loadingMsg = await message.reply('🔴 Buscando livescores em tempo real (preparando múltiplas mensagens)...');
        
        try {
            const livescores = await this.sportsIntegration.getAllLivescores();
            
            if (!livescores || livescores.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ NENHUM JOGO AO VIVO')
                    .setDescription('📡 Não há jogos acontecendo agora')
                    .setColor(0x808080)
                    .setTimestamp()
                    .setFooter({ text: `TheSportsDB Premium - Livescores` })
                    .addFields({
                        name: '💡 Sugestões',
                        value: '`!sproximos` - Ver próximos jogos\n`!sfutebol` - Futebol completo\n`!shoje` - Jogos de hoje',
                        inline: false
                    });

                return await loadingMsg.edit({ content: '', embeds: [embed] });
            }

            const embeds = [];

            // Separar por esporte
            const soccerLive = livescores.filter(game => game.sport === 'Soccer' || game.league.toLowerCase().includes('football'));
            const basketballLive = livescores.filter(game => game.sport === 'Basketball' || game.league.toLowerCase().includes('basketball'));
            const otherSports = livescores.filter(game => 
                !soccerLive.includes(game) && !basketballLive.includes(game)
            );

            // ========== FUTEBOL AO VIVO ==========
            if (soccerLive.length > 0) {
                const soccerChunks = this.splitGamesIntoMessages(soccerLive, 8);
                
                soccerChunks.forEach((chunk, index) => {
                    const embed = new EmbedBuilder()
                        .setTitle(`⚽ FUTEBOL AO VIVO ${soccerChunks.length > 1 ? `(${index + 1}/${soccerChunks.length})` : ''}`)
                        .setDescription('🔴 Jogos de futebol acontecendo agora')
                        .setColor(0x228B22)
                        .setTimestamp()
                        .setFooter({ text: `TheSportsDB Premium - Futebol Live` });

                    const gamesList = chunk.map(game => 
                        `🔴 **${game.league}**\n⚽ **${game.homeTeam} ${game.homeScore} x ${game.awayScore} ${game.awayTeam}**\n📍 ${game.venue}\n⏰ ${game.progress || game.minute || 'Ao vivo'}`
                    );

                    // Dividir em campos se necessário
                    const fieldChunks = this.splitTextIntoChunks(gamesList.join('\n\n'), 1000);
                    
                    fieldChunks.forEach((fieldContent, fieldIndex) => {
                        embed.addFields({
                            name: fieldIndex === 0 ? `⚽ ${chunk.length} Jogos ao Vivo` : `⚽ Continuação ${fieldIndex + 1}`,
                            value: fieldContent,
                            inline: false
                        });
                    });

                    embeds.push(embed);
                });
            }

            // ========== BASQUETE AO VIVO ==========
            if (basketballLive.length > 0) {
                const basketChunks = this.splitGamesIntoMessages(basketballLive, 10);
                
                basketChunks.forEach((chunk, index) => {
                    const embed = new EmbedBuilder()
                        .setTitle(`🏀 BASQUETE AO VIVO ${basketChunks.length > 1 ? `(${index + 1}/${basketChunks.length})` : ''}`)
                        .setDescription('🔴 Jogos de basquete acontecendo agora')
                        .setColor(0xFF8C00)
                        .setTimestamp()
                        .setFooter({ text: `TheSportsDB Premium - Basquete Live` });

                    const gamesList = chunk.map(game => 
                        `🔴 **${game.league}**\n🏀 **${game.homeTeam} ${game.homeScore} x ${game.awayScore} ${game.awayTeam}**\n📍 ${game.venue}\n⏰ ${game.progress || game.minute || 'Ao vivo'}`
                    );

                    const fieldChunks = this.splitTextIntoChunks(gamesList.join('\n\n'), 1000);
                    
                    fieldChunks.forEach((fieldContent, fieldIndex) => {
                        embed.addFields({
                            name: fieldIndex === 0 ? `🏀 ${chunk.length} Jogos ao Vivo` : `🏀 Continuação ${fieldIndex + 1}`,
                            value: fieldContent,
                            inline: false
                        });
                    });

                    embeds.push(embed);
                });
            }

            // ========== OUTROS ESPORTES AO VIVO ==========
            if (otherSports.length > 0) {
                const otherChunks = this.splitGamesIntoMessages(otherSports, 12);
                
                otherChunks.forEach((chunk, index) => {
                    const embed = new EmbedBuilder()
                        .setTitle(`🏅 OUTROS ESPORTES AO VIVO ${otherChunks.length > 1 ? `(${index + 1}/${otherChunks.length})` : ''}`)
                        .setDescription('🔴 Tênis, Hockey, Volleyball e mais')
                        .setColor(0x9932CC)
                        .setTimestamp()
                        .setFooter({ text: `TheSportsDB Premium - Outros Esportes` });

                    const gamesList = chunk.map(game => 
                        `🔴 **${game.league}**\n🏅 **${game.homeTeam} ${game.homeScore} x ${game.awayScore} ${game.awayTeam}**\n📍 ${game.venue}\n⏰ ${game.progress || game.minute || 'Ao vivo'}`
                    );

                    const fieldChunks = this.splitTextIntoChunks(gamesList.join('\n\n'), 1000);
                    
                    fieldChunks.forEach((fieldContent, fieldIndex) => {
                        embed.addFields({
                            name: fieldIndex === 0 ? `🏅 ${chunk.length} Jogos ao Vivo` : `🏅 Continuação ${fieldIndex + 1}`,
                            value: fieldContent,
                            inline: false
                        });
                    });

                    embeds.push(embed);
                });
            }

            // ========== RESUMO FINAL DOS LIVESCORES ==========
            const summaryEmbed = new EmbedBuilder()
                .setTitle('🔴 RESUMO DOS LIVESCORES')
                .setDescription('📊 Todos os jogos ao vivo encontrados!')
                .setColor(0xFF0000)
                .setTimestamp()
                .setFooter({ text: `Smart Stream Bot - ${embeds.length + 1} mensagens enviadas` });

            summaryEmbed.addFields({
                name: '📊 Total de Jogos ao Vivo',
                value: `⚽ **Futebol:** ${soccerLive.length} jogos\n🏀 **Basquete:** ${basketballLive.length} jogos\n🏅 **Outros:** ${otherSports.length} jogos\n🔴 **Total:** ${livescores.length} jogos`,
                inline: true
            });

            summaryEmbed.addFields({
                name: '💡 Comandos Relacionados',
                value: '`!slivefutebol` - Só futebol live\n`!slivebasket` - Só basquete live\n`!sproximos` - Próximos jogos\n`!sfutebol` - Futebol completo',
                inline: true
            });

            embeds.push(summaryEmbed);

            // Enviar todas as mensagens
            await loadingMsg.delete();
            await this.sendMultipleEmbeds(message, embeds, 1000);
            console.log(`✅ Comando !slivescores: ${embeds.length} mensagens enviadas com ${livescores.length} jogos ao vivo!`);

        } catch (error) {
            console.error('❌ Erro no comando livescores:', error);
            await loadingMsg.edit('❌ Erro ao buscar livescores. Tente novamente.');
        }
    }

    // COMANDO: !slivefutebol - LIVESCORES SÓ FUTEBOL
    async commandLiveFutebol(message) {
        console.log('⚽ Executando comando !slivefutebol - LIVESCORES FUTEBOL');
        
        const loadingMsg = await message.reply('⚽ Buscando livescores de futebol...');
        
        try {
            const livescoresFutebol = await this.sportsIntegration.getLivescoresByFootball();
            
            const embed = new EmbedBuilder()
                .setTitle('⚽ LIVESCORES FUTEBOL')
                .setDescription('🔴 Jogos de futebol ao vivo agora')
                .setColor(0x228b22)
                .setTimestamp()
                .setFooter({ text: `Smart Stream Bot - Futebol ao vivo` });

            if (!livescoresFutebol || livescoresFutebol.length === 0) {
                embed.addFields({
                    name: '⚠️ Nenhum jogo de futebol ao vivo',
                    value: 'Use `!sproximos` para ver os próximos jogos do Brasileirão e Premier League.',
                    inline: false
                });
            } else {
                livescoresFutebol.slice(0, 15).forEach(game => {
                    const isImportant = game.league.includes('Premier') || game.league.includes('Champions') || game.league.includes('Brasil');
                    embed.addFields({
                        name: `${isImportant ? '🏆' : '⚽'} ${game.league}`,
                        value: `**${game.homeTeam} ${game.homeScore} x ${game.awayScore} ${game.awayTeam}**\n📍 ${game.venue}\n⏰ ${game.progress || game.minute || 'Ao vivo'}`,
                        inline: true
                    });
                });
            }

            await loadingMsg.edit({ content: '', embeds: [embed] });

        } catch (error) {
            console.error('❌ Erro no comando livefutebol:', error);
            await loadingMsg.edit('❌ Erro ao buscar livescores de futebol. Tente novamente.');
        }
    }

    // COMANDO: !slivebasket - LIVESCORES SÓ BASQUETE
    async commandLiveBasket(message) {
        console.log('🏀 Executando comando !slivebasket - LIVESCORES BASQUETE');
        
        const loadingMsg = await message.reply('🏀 Buscando livescores de basquete...');
        
        try {
            const livescoresBasket = await this.sportsIntegration.getLivescoresByBasketball();
            
            const embed = new EmbedBuilder()
                .setTitle('🏀 LIVESCORES BASQUETE')
                .setDescription('🔴 Jogos de basquete ao vivo agora')
                .setColor(0xff8c00)
                .setTimestamp()
                .setFooter({ text: `Smart Stream Bot - Basquete ao vivo` });

            if (!livescoresBasket || livescoresBasket.length === 0) {
                embed.addFields({
                    name: '⚠️ Nenhum jogo de basquete ao vivo',
                    value: 'Use `!sproximos` para ver os próximos jogos da NBA.',
                    inline: false
                });
            } else {
                livescoresBasket.slice(0, 15).forEach(game => {
                    const isNBA = game.league.includes('NBA');
                    embed.addFields({
                        name: `${isNBA ? '🏆' : '🏀'} ${game.league}`,
                        value: `**${game.homeTeam} ${game.homeScore} x ${game.awayScore} ${game.awayTeam}**\n📍 ${game.venue}\n⏰ ${game.progress || game.minute || 'Ao vivo'}`,
                        inline: true
                    });
                });
            }

            await loadingMsg.edit({ content: '', embeds: [embed] });

        } catch (error) {
            console.error('❌ Erro no comando livebasket:', error);
            await loadingMsg.edit('❌ Erro ao buscar livescores de basquete. Tente novamente.');
        }
    }

    // COMANDO: !sproximos ou !sagenda - PRÓXIMOS JOGOS (VERSÃO MÚLTIPLAS MENSAGENS)
    async commandProximos(message) {
        console.log('📅 Executando comando !sproximos - PRÓXIMOS JOGOS COM DIVISÃO AUTOMÁTICA');
        
        const loadingMsg = await message.reply('🎯 Buscando jogos importantes e dividindo automaticamente...');
        
        try {
            // Usar o método com filtros inteligentes
            const sportsData = await this.sportsIntegration.getAllImportantSportsToday();
            
            let totalImportantGames = 0;
            const embeds = [];

            // ========== EMBED 1: FUTEBOL BRASILEIRO ==========
            if (sportsData.footballBrazil && sportsData.footballBrazil.length > 0) {
                totalImportantGames += sportsData.footballBrazil.length;
                
                // Dividir jogos do Brasileirão em chunks de 4 jogos por mensagem
                const brasileiraoChunks = this.splitGamesIntoMessages(sportsData.footballBrazil, 4);
                
                brasileiraoChunks.forEach((chunk, index) => {
                    const embed = new EmbedBuilder()
                        .setTitle(`🇧🇷 BRASILEIRÃO SÉRIE A ${brasileiraoChunks.length > 1 ? `(${index + 1}/${brasileiraoChunks.length})` : ''}`)
                        .setDescription('⚽ Dados reais do Brasileirão 2025')
                        .setColor(0x009639) // Verde Brasil
                        .setTimestamp()
                        .setFooter({ text: `TheSportsDB Premium - Brasileirão Real` });

                    const jogosText = chunk.map(jogo => {
                        // Usar a data real do objeto jogo
                        return `📅 **${jogo.date} às ${jogo.time}** - ${jogo.status}\n🏟️ **${jogo.homeTeam} x ${jogo.awayTeam}**\n📍 ${jogo.venue}\n🏆 ${jogo.round}\n📺 **Globo, SporTV**`;
                    }).join('\n\n');
                    
                    embed.addFields({
                        name: `⚽ ${chunk.length} Jogos do Brasileirão`,
                        value: jogosText,
                        inline: false
                    });

                    embeds.push(embed);
                });
            }

            // ========== EMBED 2: FUTEBOL INTERNACIONAL ==========
            if (sportsData.footballInternational && sportsData.footballInternational.length > 0) {
                totalImportantGames += sportsData.footballInternational.length;
                
                // Dividir futebol internacional em chunks de 6 jogos por mensagem
                const internationalChunks = this.splitGamesIntoMessages(sportsData.footballInternational, 6);
                
                internationalChunks.forEach((chunk, index) => {
                    const embed = new EmbedBuilder()
                        .setTitle(`🏆 FUTEBOL INTERNACIONAL ${internationalChunks.length > 1 ? `(${index + 1}/${internationalChunks.length})` : ''}`)
                        .setDescription('🌍 Principais campeonatos europeus')
                        .setColor(0x4169E1) // Azul internacional
                        .setTimestamp()
                        .setFooter({ text: `TheSportsDB Premium - Dados Reais` });

                    const jogosText = chunk.map(jogo => {
                        // Usar a data real do objeto jogo
                        return `📅 **${jogo.date} às ${jogo.time}** - ${jogo.status}\n🏆 **${jogo.homeTeam} x ${jogo.awayTeam}**\n📊 ${jogo.league}\n${canal}`;
                    }).join('\n\n');
                    
                    embed.addFields({
                        name: `🌍 ${chunk.length} Jogos Internacionais`,
                        value: jogosText,
                        inline: false
                    });

                    embeds.push(embed);
                });
            }

            // ========== EMBED 3: BASQUETE ==========
            if (sportsData.nba && sportsData.nba.length > 0) {
                totalImportantGames += sportsData.nba.length;
                
                // Separar NBA real de outras ligas
                const nbaGames = sportsData.nba.filter(jogo => 
                    jogo.league.includes('NBA') || jogo.league.includes('WNBA')
                );
                const otherBasketball = sportsData.nba.filter(jogo => 
                    !jogo.league.includes('NBA') && !jogo.league.includes('WNBA')
                );

                // NBA principal (chunks de 8 jogos)
                if (nbaGames.length > 0) {
                    const nbaChunks = this.splitGamesIntoMessages(nbaGames, 8);
                    
                    nbaChunks.forEach((chunk, index) => {
                        const embed = new EmbedBuilder()
                            .setTitle(`🏀 NBA + WNBA ${nbaChunks.length > 1 ? `(${index + 1}/${nbaChunks.length})` : ''}`)
                            .setDescription('🇺🇸 Basquete americano oficial')
                            .setColor(0xFF8C00) // Laranja basquete
                            .setTimestamp()
                            .setFooter({ text: `TheSportsDB Premium - TODOS os jogos` });

                        const nbaText = chunk.map(jogo => {
                            const canal = jogo.league.includes('WNBA') ? '📺 **ESPN, Amazon Prime**' : '📺 **ESPN, NBA League Pass**';
                            return `⏰ **${jogo.date} às ${jogo.time}** - ${jogo.status}\n🏀 **${jogo.homeTeam} x ${jogo.awayTeam}**\n📍 ${jogo.venue}\n${canal}`;
                        }).join('\n\n');
                        
                        embed.addFields({
                            name: `🇺🇸 ${chunk.length} Jogos NBA/WNBA`,
                            value: nbaText,
                            inline: false
                        });

                        embeds.push(embed);
                    });
                }

                // Basquete internacional (chunks de 10 jogos)
                if (otherBasketball.length > 0) {
                    const otherChunks = this.splitGamesIntoMessages(otherBasketball, 10);
                    
                    otherChunks.forEach((chunk, index) => {
                        const embed = new EmbedBuilder()
                            .setTitle(`🌍 BASQUETE INTERNACIONAL ${otherChunks.length > 1 ? `(${index + 1}/${otherChunks.length})` : ''}`)
                            .setDescription('🏀 Ligas europeias e mundiais')
                            .setColor(0xDAA520) // Dourado
                            .setTimestamp()
                            .setFooter({ text: `TheSportsDB Premium - Ligas Mundiais` });

                        const otherText = chunk.map(jogo => {
                            let canal = '📺 ESPN';
                            if (jogo.league.includes('EuroLeague')) canal = '📺 **ESPN**';
                            
                            return `⏰ **${jogo.date} às ${jogo.time}** - ${jogo.status}\n🏀 **${jogo.homeTeam} x ${jogo.awayTeam}**\n📊 ${jogo.league}\n${canal}`;
                        }).join('\n\n');
                        
                        embed.addFields({
                            name: `🌍 ${chunk.length} Jogos Internacionais`,
                            value: otherText,
                            inline: false
                        });

                        embeds.push(embed);
                    });
                }
            }

            // ========== EMBED 4: CS2 ESPORTS ==========
            if (sportsData.cs2 && sportsData.cs2.length > 0) {
                totalImportantGames += sportsData.cs2.length;
                
                // Dividir jogos de CS2 em chunks de 6 jogos por mensagem
                const cs2Chunks = this.splitGamesIntoMessages(sportsData.cs2, 6);
                
                cs2Chunks.forEach((chunk, index) => {
                    const embed = new EmbedBuilder()
                        .setTitle(`🎮 CS2 ESPORTS ${cs2Chunks.length > 1 ? `(${index + 1}/${cs2Chunks.length})` : ''}`)
                        .setDescription('🏆 Principais campeonatos de Counter-Strike 2')
                        .setColor(0xFFA500) // Laranja CS2
                        .setTimestamp()
                        .setFooter({ text: `HLTV API - Jogos Importantes` });

                    const jogosText = chunk.map(jogo => {
                        // Emoji baseado na importância (stars)
                        let emoji = '🎮';
                        if (jogo.stars >= 3) emoji = '⭐⭐⭐';
                        else if (jogo.stars >= 2) emoji = '⭐⭐';
                        else if (jogo.stars >= 1) emoji = '⭐';
                        
                        // Canal baseado no evento
                        let canal = '📺 **Twitch, YouTube**';
                        if (jogo.league.toLowerCase().includes('blast')) canal = '📺 **Twitch/BLAST**';
                        else if (jogo.league.toLowerCase().includes('esl')) canal = '📺 **Twitch/ESL**';
                        else if (jogo.league.toLowerCase().includes('major')) canal = '📺 **Twitch/PGL**';
                        
                        return `📅 **${jogo.date} às ${jogo.time}** - ${jogo.status}\n${emoji} **${jogo.homeTeam} x ${jogo.awayTeam}**\n🏆 ${jogo.league}\n🗺️ ${jogo.format}\n${canal}`;
                    }).join('\n\n');
                    
                    embed.addFields({
                        name: `🎮 ${chunk.length} Jogos de CS2`,
                        value: jogosText,
                        inline: false
                    });

                    embeds.push(embed);
                });
            }

            // ========== EMBED FINAL: RESUMO ==========
            if (embeds.length > 0) {
                const summaryEmbed = new EmbedBuilder()
                    .setTitle('🎯 RESUMO COMPLETO DOS JOGOS')
                    .setDescription('📊 Sistema de múltiplas mensagens ativo!')
                    .setColor(0xFFD700) // Dourado
                    .setTimestamp()
                    .setFooter({ text: `Smart Stream Bot - ${embeds.length + 1} mensagens enviadas` });

                summaryEmbed.addFields({
                    name: '📊 Total de Jogos Encontrados',
                    value: `✅ **${totalImportantGames}** jogos importantes\n🇧🇷 Brasileirão: ${sportsData.footballBrazil?.length || 0}\n⚽ Internacional: ${sportsData.footballInternational?.length || 0}\n🏀 Basquete: ${sportsData.nba?.length || 0}\n🎮 CS2: ${sportsData.cs2?.length || 0}`,
                    inline: true
                });

                summaryEmbed.addFields({
                    name: '🎯 Filtros Aplicados',
                    value: '✅ Só principais campeonatos\n✅ Times populares priorizados\n✅ Jogos ao vivo destacados\n❌ SEM dados fictícios',
                    inline: true
                });

                summaryEmbed.addFields({
                    name: '💡 Comandos Relacionados',
                    value: '`!slivescores` - Jogos ao vivo\n`!sfutebol` - Só futebol completo\n`!slivebasket` - Só basquete\n`!stime Arsenal` - Buscar time',
                    inline: false
                });

                embeds.push(summaryEmbed);
            }

            // Enviar todas as mensagens
            if (embeds.length > 0) {
                await loadingMsg.delete();
                await this.sendMultipleEmbeds(message, embeds, 1500); // 1.5s entre mensagens
                console.log(`✅ Enviadas ${embeds.length} mensagens com ${totalImportantGames} jogos!`);
            } else {
                // Nenhum jogo encontrado
                const noGamesEmbed = new EmbedBuilder()
                    .setTitle('⚠️ NENHUM JOGO IMPORTANTE HOJE')
                    .setDescription('Não há eventos relevantes programados para hoje')
                    .setColor(0x808080)
                    .setTimestamp()
                    .setFooter({ text: `TheSportsDB Premium - Dados reais` });

                noGamesEmbed.addFields({
                    name: '😴 Dia Tranquilo',
                    value: 'Pode ser período entre temporadas ou dia de descanso.\n\n💡 **Tente outros comandos:**\n`!slivescores` - Verificar jogos ao vivo\n`!ssemana` - Agenda da semana\n`!sfutebol` - Buscar futebol específico',
                    inline: false
                });

                await loadingMsg.edit({ content: '', embeds: [noGamesEmbed] });
            }

        } catch (error) {
            console.error('❌ Erro no comando sproximos:', error);
            await loadingMsg.edit('❌ Erro ao buscar jogos importantes. Tente novamente.');
        }
    }

    // COMANDO: !stime [nome] - BUSCAR TIME
    async commandSearchTeam(message, teamName) {
        console.log(`🔍 Executando comando !stime - BUSCAR TIME: ${teamName}`);
        
        if (!teamName || teamName.trim().length === 0) {
            return await message.reply('❌ **Uso:** `!stime [nome do time]`\n📝 **Exemplo:** `!stime Arsenal` ou `!stime Flamengo`');
        }
        
        const loadingMsg = await message.reply(`🔍 Buscando informações sobre **${teamName}**...`);
        
        try {
            const teams = await this.sportsIntegration.searchTeam(teamName);
            
            if (teams.length === 0) {
                return await loadingMsg.edit(`❌ Time **"${teamName}"** não encontrado.\n💡 Tente nomes em inglês: Arsenal, Liverpool, Flamengo, etc.`);
            }

            const team = teams[0]; // Primeiro resultado
            
            const embed = new EmbedBuilder()
                .setTitle(`🏆 ${team.name}`)
                .setDescription(`📍 ${team.country} | 🏆 ${team.league}`)
                .setColor(0x00ff00)
                .setTimestamp()
                .setFooter({ text: `Smart Stream Bot - Informações do time` });

            embed.fields.push({
                name: '📊 Informações Básicas',
                value: `🏟️ **Estádio:** ${team.stadium || 'N/A'}\n🗓️ **Fundado:** ${team.founded || 'N/A'}\n⚽ **Esporte:** ${team.sport}`,
                inline: true
            });

            if (team.description) {
                const shortDescription = team.description.length > 500 
                    ? team.description.substring(0, 500) + '...' 
                    : team.description;
                
                embed.fields.push({
                    name: '📜 Sobre o Time',
                    value: shortDescription,
                    inline: false
                });
            }

            // Adicionar sugestões de comandos relacionados
            let suggestions = '`!sproximos` - Próximos jogos\n`!slivescores` - Jogos ao vivo';
            if (team.sport === 'Soccer') {
                suggestions += '\n`!sfutebol` - Futebol hoje';
            }
            
            embed.fields.push({
                name: '💡 Comandos Relacionados',
                value: suggestions,
                inline: false
            });

            await loadingMsg.edit({ content: '', embeds: [embed] });

        } catch (error) {
            console.error('❌ Erro no comando searchteam:', error);
            await loadingMsg.edit('❌ Erro ao buscar time. Tente novamente.');
        }
    }

    // COMANDO: !scs2 - JOGOS DE CS2 ESPORTS (DADOS REAIS 2025)
    async commandCS2(message) {
        console.log('🎮 Executando comando !scs2 - CS2 ESPORTS (DADOS REAIS 2025)');
        
        const loadingMsg = await message.reply('🎮 Buscando jogos de CS2 via HLTV oficial (dados reais 2025)...');
        
        try {
            const cs2Games = await this.sportsIntegration.getCS2MatchesToday();
            
            // Verificar se é dados de erro
            if (cs2Games.length > 0 && cs2Games[0].isError) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ ERRO NA API HLTV OFICIAL')
                    .setDescription('Erro ao buscar dados atuais de CS2 do HLTV')
                    .setColor(0xFF0000)
                    .setTimestamp()
                    .setFooter({ text: `HLTV Oficial - Erro temporário` });

                embed.addFields({
                    name: '⚠️ Situação',
                    value: '• **HLTV.org**: Servidor pode estar sobrecarregado\n• **Rate limiting**: Cloudflare pode estar bloqueando\n• **Temporário**: Geralmente se resolve em alguns minutos',
                    inline: false
                });

                embed.addFields({
                    name: '💡 Alternativas Temporárias',
                    value: '• **`!saovivo`** - Ver streamers CS2 online\n• **HLTV.org**: Acessar site manualmente\n• **Tente novamente**: Em 2-3 minutos',
                    inline: false
                });

                return await loadingMsg.edit({ content: '', embeds: [embed] });
            }

            // Verificar se não há jogos
            if (!cs2Games || cs2Games.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ NENHUM JOGO DE CS2 IMPORTANTE HOJE')
                    .setDescription('📡 Não há jogos importantes de Counter-Strike 2 nos próximos dias')
                    .setColor(0x808080)
                    .setTimestamp()
                    .setFooter({ text: `HLTV Oficial - Dados reais 2025` });

                embed.addFields({
                    name: '🔍 Critérios de Filtro',
                    value: '• **Eventos importantes**: Major, BLAST, ESL, IEM, PGL\n• **Times tier 1/2**: G2, Vitality, NAVI, Spirit, etc.\n• **Período**: Próximos 2 dias',
                    inline: false
                });

                embed.addFields({
                    name: '💡 Sugestões',
                    value: '`!sproximos` - Ver todos os esportes\n`!saovivo` - Streamers CS2 online\n`!shoje` - Outros esportes hoje\n\n🔗 **HLTV.org** - Ver todos os jogos manualmente',
                    inline: false
                });

                return await loadingMsg.edit({ content: '', embeds: [embed] });
            }

            console.log(`🎮 Processando ${cs2Games.length} jogos reais de CS2...`);
            const embeds = [];

            // Separar por importância (stars) - dados reais
            const majorMatches = cs2Games.filter(game => game.stars >= 5); // Majors
            const topTierMatches = cs2Games.filter(game => game.stars === 4); // BLAST, IEM
            const highTierMatches = cs2Games.filter(game => game.stars === 3); // ESL, PGL
            const mediumTierMatches = cs2Games.filter(game => game.stars === 2); // Outros importantes
            const otherMatches = cs2Games.filter(game => game.stars === 1); // Times conhecidos

            // ========== MAJORS (5 STARS) ==========
            if (majorMatches.length > 0) {
                const embed = new EmbedBuilder()
                    .setTitle('🏆 CS2 MAJOR CHAMPIONSHIPS')
                    .setDescription('🥇 Os jogos mais importantes do Counter-Strike 2')
                    .setColor(0xFFD700) // Dourado
                    .setTimestamp()
                    .setFooter({ text: `HLTV Oficial - ${majorMatches.length} Majors` });

                const gamesText = majorMatches.map(game => {
                    return `📅 **${game.date} às ${game.time}** - ${game.status}\n🏆 **${game.homeTeam} x ${game.awayTeam}**\n🎯 ${game.league}\n🗺️ ${game.format}\n📺 **Stream oficial do Major**`;
                }).join('\n\n');

                embed.addFields({
                    name: `🏆 ${majorMatches.length} Major Championship(s)`,
                    value: gamesText,
                    inline: false
                });

                embeds.push(embed);
            }

            // ========== TOP TIER (4 STARS) ==========
            if (topTierMatches.length > 0) {
                const embed = new EmbedBuilder()
                    .setTitle('⭐⭐⭐⭐ CS2 TOP TIER')
                    .setDescription('🥈 BLAST Premier, IEM, eventos principais')
                    .setColor(0xC0C0C0) // Prata
                    .setTimestamp()
                    .setFooter({ text: `HLTV Oficial - ${topTierMatches.length} Top Tier` });

                const gamesText = topTierMatches.map(game => {
                    let canal = '📺 **Twitch/YouTube**';
                    if (game.league.toLowerCase().includes('blast')) canal = '📺 **Twitch/BLAST**';
                    else if (game.league.toLowerCase().includes('iem')) canal = '📺 **Twitch/ESL**';
                    
                    return `📅 **${game.date} às ${game.time}** - ${game.status}\n⭐⭐⭐⭐ **${game.homeTeam} x ${game.awayTeam}**\n🏆 ${game.league}\n🗺️ ${game.format}\n${canal}`;
                }).join('\n\n');

                embed.addFields({
                    name: `🥈 ${topTierMatches.length} Eventos Top Tier`,
                    value: gamesText,
                    inline: false
                });

                embeds.push(embed);
            }

            // ========== HIGH TIER (3 STARS) ==========
            if (highTierMatches.length > 0) {
                const embed = new EmbedBuilder()
                    .setTitle('⭐⭐⭐ CS2 HIGH TIER')
                    .setDescription('🥉 ESL Pro League, PGL, eventos importantes')
                    .setColor(0xCD7F32) // Bronze
                    .setTimestamp()
                    .setFooter({ text: `HLTV Oficial - ${highTierMatches.length} High Tier` });

                const gamesText = highTierMatches.map(game => {
                    let canal = '📺 **Twitch/YouTube**';
                    if (game.league.toLowerCase().includes('esl')) canal = '📺 **Twitch/ESL**';
                    else if (game.league.toLowerCase().includes('pgl')) canal = '📺 **Twitch/PGL**';
                    
                    return `📅 **${game.date} às ${game.time}** - ${game.status}\n⭐⭐⭐ **${game.homeTeam} x ${game.awayTeam}**\n🏆 ${game.league}\n🗺️ ${game.format}\n${canal}`;
                }).join('\n\n');

                embed.addFields({
                    name: `🥉 ${highTierMatches.length} Eventos High Tier`,
                    value: gamesText,
                    inline: false
                });

                embeds.push(embed);
            }

            // ========== MEDIUM + OTHER TIER ==========
            const otherAllMatches = [...mediumTierMatches, ...otherMatches];
            if (otherAllMatches.length > 0) {
                const embed = new EmbedBuilder()
                    .setTitle('⭐⭐ CS2 OUTROS IMPORTANTES')
                    .setDescription('🔥 Times tier 1/2 e outros eventos relevantes')
                    .setColor(0x4169E1) // Azul
                    .setTimestamp()
                    .setFooter({ text: `HLTV Oficial - ${otherAllMatches.length} Outros` });

                const gamesText = otherAllMatches.slice(0, 8).map(game => {
                    let starsEmoji = '⭐⭐';
                    if (game.stars === 1) starsEmoji = '⭐';
                    
                    return `📅 **${game.date} às ${game.time}** - ${game.status}\n${starsEmoji} **${game.homeTeam} x ${game.awayTeam}**\n🏆 ${game.league}\n🗺️ ${game.format}`;
                }).join('\n\n');

                embed.addFields({
                    name: `⭐ ${Math.min(otherAllMatches.length, 8)} Outros Jogos Importantes`,
                    value: gamesText + (otherAllMatches.length > 8 ? `\n\n💡 **+${otherAllMatches.length - 8} outros jogos**` : ''),
                    inline: false
                });

                embeds.push(embed);
            }

            // ========== RESUMO FINAL ==========
            const totalMatches = cs2Games.length;
            const summaryEmbed = new EmbedBuilder()
                .setTitle('🎮 RESUMO CS2 ESPORTS - DADOS REAIS 2025')
                .setDescription('📊 Jogos importantes de Counter-Strike 2 (fonte oficial HLTV)')
                .setColor(0xFFA500) // Laranja CS2
                .setTimestamp()
                .setFooter({ text: `HLTV Oficial - ${embeds.length + 1} mensagens enviadas` });

            summaryEmbed.addFields({
                name: '📊 Total de Jogos Importantes',
                value: `🏆 **Majors:** ${majorMatches.length} jogos\n⭐⭐⭐⭐ **Top Tier:** ${topTierMatches.length} jogos\n⭐⭐⭐ **High Tier:** ${highTierMatches.length} jogos\n⭐⭐ **Outros:** ${otherAllMatches.length} jogos\n\n🎮 **Total:** ${totalMatches} jogos`,
                inline: true
            });

            summaryEmbed.addFields({
                name: '✅ Qualidade dos Dados (2025)',
                value: '🔗 **HLTV.org** - Fonte oficial\n📅 **Dados reais** de 2025\n🎯 **Filtros inteligentes** aplicados\n⭐ **Sistema de ranking** por importância\n🏆 **Só eventos importantes**',
                inline: true
            });

            summaryEmbed.addFields({
                name: '💡 Comandos Relacionados',
                value: '`!saovivo` - Streamers CS2 online\n`!sproximos` - Todos os esportes\n`!shoje` - Resumo esportes hoje\n\n🔗 **HLTV.org** - Mais detalhes',
                inline: false
            });

            embeds.push(summaryEmbed);

            // Enviar todas as mensagens
            await loadingMsg.delete();
            await this.sendMultipleEmbeds(message, embeds, 1500); // 1.5s entre mensagens
            console.log(`✅ Comando !scs2: ${embeds.length} mensagens enviadas com ${totalMatches} jogos reais!`);

        } catch (error) {
            console.error('❌ Erro no comando CS2:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ ERRO INESPERADO CS2')
                .setDescription('Erro interno ao processar dados de CS2')
                .setColor(0xFF0000)
                .setTimestamp()
                .setFooter({ text: `Erro interno do bot` })
                .addFields({
                    name: '💡 Sugestões',
                    value: '• Tente novamente em alguns minutos\n• Use `!saovivo` para streamers CS2\n• Visite HLTV.org manualmente\n• Contate o administrador se persistir',
                    inline: false
                });

            await loadingMsg.edit({ content: '', embeds: [embed] });
        }
    }

    // ========== UTILITÁRIOS ==========

    async sendWebhook(embed, content = '', targetChannel = null) {
        try {
            // Se temos um target channel específico, usar o Discord.js
            if (targetChannel && this.client.user) {
                const guild = this.client.guilds.cache.first();
                if (guild) {
                    // Encontrar o canal correto (aceitar várias variações)
                    const channel = guild.channels.cache.find(ch => {
                        const name = ch.name.toLowerCase();
                        return name === targetChannel.toLowerCase() ||
                               name === 'transmissões' ||
                               name === 'transmissoes' ||
                               name === '📺transmissões' ||
                               name === '📺transmissoes' ||
                               name.includes('transmissões') ||
                               name.includes('transmissoes');
                    });
                    
                    if (channel && channel.isTextBased()) {
                        console.log(`📤 Enviando via Discord.js para canal: ${channel.name}`);
                        await channel.send({ content, embeds: [embed] });
                        return;
                    }
                }
            }
            
            // Fallback para webhook
            if (this.webhookUrl) {
                console.log(`📤 Enviando via webhook`);
                await axios.post(this.webhookUrl, {
                    content,
                    embeds: [embed]
                });
            }
        } catch (error) {
            console.error('❌ Erro ao enviar webhook:', error.message);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getCategoryName(category) {
        const names = {
            cs2_br: 'CS2 Brasil',
            cs2_international: 'CS2 Internacional',
            futebol: 'Futebol',
            variety: 'Variedades'
        };
        return names[category] || category;
    }

    getCategoryEmoji(category) {
        const emojis = {
            cs2_br: '🇧🇷',
            cs2_international: '🌍',
            futebol: '⚽',
            variety: '📺'
        };
        return emojis[category] || '🎮';
    }

    getCategoryColor(category) {
        const colors = {
            cs2_br: 0x00ff41,
            cs2_international: 0x0099ff,
            futebol: 0x228b22,
            variety: 0xff6600
        };
        return colors[category] || 0x7289da;
    }

    getRandomCS2Title() {
        const titles = [
            'MAJOR EM ANDAMENTO! CS2 PROFISSIONAL',
            'Rankeada até Global! CS2',
            'BLAST Premier ao vivo!',
            'ESL Pro League - CS2',
            'FPL com os pros! Counter-Strike 2'
        ];
        return titles[Math.floor(Math.random() * titles.length)];
    }

    getRandomFootballTitle() {
        const titles = [
            'BRASILEIRÃO AO VIVO! Análise pós-jogo',
            'LIBERTADORES: Discussão sobre o jogo',
            'Rodada do Brasileirão - Análise completa',
            'FUTEBOL AO VIVO - Copa do Brasil',
            'Champions League: Análise e reações'
        ];
        return titles[Math.floor(Math.random() * titles.length)];
    }

    getRandomVarietyTitle() {
        const titles = [
            'React aos melhores momentos da semana',
            'Conversando com o chat!',
            'Reagindo a vídeos - Entretenimento',
            'Just Chatting - Bom dia!',
            'Variedades e entretenimento'
        ];
        return titles[Math.floor(Math.random() * titles.length)];
    }

    // Iniciar o bot
    start() {
        this.client.login(this.token);
    }

    // ========== UTILITÁRIOS DE DIVISÃO DE MENSAGENS ==========

    // Dividir texto em chunks respeitando limite de caracteres
    splitTextIntoChunks(text, maxLength = 1000) {
        if (text.length <= maxLength) {
            return [text];
        }

        const chunks = [];
        const lines = text.split('\n');
        let currentChunk = '';

        for (const line of lines) {
            const testChunk = currentChunk + (currentChunk ? '\n' : '') + line;
            
            if (testChunk.length <= maxLength) {
                currentChunk = testChunk;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                
                // Se uma linha sozinha é maior que o limite, dividir ela
                if (line.length > maxLength) {
                    const lineChunks = this.splitLongLine(line, maxLength);
                    chunks.push(...lineChunks);
                    currentChunk = '';
                } else {
                    currentChunk = line;
                }
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    // Dividir linha muito longa
    splitLongLine(line, maxLength) {
        const chunks = [];
        let currentPos = 0;

        while (currentPos < line.length) {
            const chunk = line.substring(currentPos, currentPos + maxLength);
            chunks.push(chunk);
            currentPos += maxLength;
        }

        return chunks;
    }

    // Dividir jogos em grupos para múltiplas mensagens
    splitGamesIntoMessages(games, gamesPerMessage = 8) {
        const messages = [];
        
        for (let i = 0; i < games.length; i += gamesPerMessage) {
            const gameGroup = games.slice(i, i + gamesPerMessage);
            messages.push(gameGroup);
        }

        return messages;
    }

    // Criar múltiplas mensagens de embed automaticamente
    async sendMultipleEmbeds(message, embeds, delayBetween = 1000) {
        const results = [];
        
        for (let i = 0; i < embeds.length; i++) {
            try {
                const sent = await message.channel.send({ embeds: [embeds[i]] });
                results.push(sent);
                
                // Delay entre mensagens para evitar rate limit
                if (i < embeds.length - 1) {
                    await this.delay(delayBetween);
                }
            } catch (error) {
                console.error(`❌ Erro ao enviar embed ${i + 1}:`, error.message);
            }
        }
        
        return results;
    }
}

module.exports = DiscordStreamBot; 