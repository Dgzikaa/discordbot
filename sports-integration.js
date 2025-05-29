// ========== INTEGRAÇÃO DE ESPORTES COM API-SPORTS.IO ==========

const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

class SportsIntegration {
    constructor(config) {
        this.config = config;
    }

    // ========== COMANDOS DE BASQUETE ==========

    async commandNBA(message) {
        console.log('🏀 Executando comando !snba');
        
        const loadingMsg = await message.reply('🏀 Buscando jogos da NBA...');
        
        try {
            const games = await this.fetchAPISportsData('basketball', '1'); // NBA league ID = 1
            
            const embed = new EmbedBuilder()
                .setTitle('🏀 NBA - JOGOS DE HOJE')
                .setDescription('Jogos da NBA programados para hoje')
                .setColor(0xed7d31)
                .setTimestamp()
                .setFooter({ text: `Smart Stream Bot - NBA` });

            if (games.length > 0) {
                const gamesList = games.map(game => 
                    `🕐 ${game.time} - **${game.homeTeam}** vs **${game.awayTeam}**\n📺 ESPN, NBA League Pass`
                ).join('\n\n');
                
                embed.addFields({ name: '🏀 Jogos de Hoje', value: gamesList, inline: false });
            } else {
                embed.addFields({ 
                    name: '📅 Nenhum jogo hoje', 
                    value: 'Não há jogos da NBA programados para hoje.\n\n🔧 Configure API_SPORTS_TOKEN para dados reais.',
                    inline: false 
                });
            }

            await loadingMsg.edit({ content: null, embeds: [embed] });
        } catch (error) {
            console.error('❌ Erro NBA:', error.message);
            await loadingMsg.edit({ content: '❌ Erro ao buscar dados da NBA. Verifique a configuração da API.' });
        }
    }

    async commandNBB(message) {
        console.log('🏀 Executando comando !snbb');
        
        const embed = new EmbedBuilder()
            .setTitle('🏀 NBB - NOVO BASQUETE BRASIL')
            .setDescription('Basquete brasileiro - Nacional')
            .setColor(0x008f39)
            .setTimestamp()
            .setFooter({ text: `Smart Stream Bot - NBB` })
            .addFields({ 
                name: '🇧🇷 NBB 2024/25', 
                value: 'Temporada do Novo Basquete Brasil\n\n📺 SporTV, ESPN Brasil\n📱 NBB.com.br',
                inline: false 
            });

        await message.reply({ embeds: [embed] });
    }

    // ========== COMANDOS DE TÊNIS ==========

    async commandTenis(message) {
        console.log('🎾 Executando comando !stenis');
        
        const loadingMsg = await message.reply('🎾 Buscando torneios de tênis...');
        
        try {
            const tournaments = await this.fetchAPISportsData('tennis', 'tournaments');
            
            const embed = new EmbedBuilder()
                .setTitle('🎾 TÊNIS - TORNEIOS ATIVOS')
                .setDescription('Principais torneios de tênis em andamento')
                .setColor(0xffd700)
                .setTimestamp()
                .setFooter({ text: `Smart Stream Bot - Tênis` });

            if (tournaments.length > 0) {
                const tournamentsList = tournaments.slice(0, 5).map(tournament => 
                    `🏆 **${tournament.name}**\n📅 ${tournament.dates}\n📺 ESPN, SporTV`
                ).join('\n\n');
                
                embed.addFields({ name: '🎾 Torneios Ativos', value: tournamentsList, inline: false });
            } else {
                embed.addFields({ 
                    name: '🎾 Grand Slams 2025', 
                    value: '🇦🇺 Australian Open - Janeiro\n🇫🇷 Roland Garros - Maio/Junho\n🇬🇧 Wimbledon - Junho/Julho\n🇺🇸 US Open - Agosto/Setembro\n\n🔧 Configure API_SPORTS_TOKEN para dados reais.',
                    inline: false 
                });
            }

            await loadingMsg.edit({ content: null, embeds: [embed] });
        } catch (error) {
            console.error('❌ Erro Tênis:', error.message);
            await loadingMsg.edit({ content: '❌ Erro ao buscar dados de tênis. Verifique a configuração da API.' });
        }
    }

    async commandATP(message) {
        console.log('🎾 Executando comando !satp');
        
        const embed = new EmbedBuilder()
            .setTitle('🎾 ATP RANKING')
            .setDescription('Top 10 do ranking masculino ATP')
            .setColor(0x0066cc)
            .setTimestamp()
            .setFooter({ text: `Smart Stream Bot - ATP` })
            .addFields({ 
                name: '🏆 TOP 5 ATP (Janeiro 2025)', 
                value: '1️⃣ Jannik Sinner (ITA)\n2️⃣ Alexander Zverev (GER)\n3️⃣ Carlos Alcaraz (ESP)\n4️⃣ Taylor Fritz (USA)\n5️⃣ Daniil Medvedev (RUS)\n\n🔧 Configure API_SPORTS_TOKEN para dados reais.',
                inline: false 
            });

        await message.reply({ embeds: [embed] });
    }

    async commandWTA(message) {
        console.log('🎾 Executando comando !swta');
        
        const embed = new EmbedBuilder()
            .setTitle('🎾 WTA RANKING')
            .setDescription('Top 10 do ranking feminino WTA')
            .setColor(0xd1477a)
            .setTimestamp()
            .setFooter({ text: `Smart Stream Bot - WTA` })
            .addFields({ 
                name: '🏆 TOP 5 WTA (Janeiro 2025)', 
                value: '1️⃣ Aryna Sabalenka (BLR)\n2️⃣ Iga Swiatek (POL)\n3️⃣ Coco Gauff (USA)\n4️⃣ Jasmine Paolini (ITA)\n5️⃣ Zheng Qinwen (CHN)\n\n🇧🇷 Brasileiras: Bia Haddad Maia\n\n🔧 Configure API_SPORTS_TOKEN para dados reais.',
                inline: false 
            });

        await message.reply({ embeds: [embed] });
    }

    // ========== COMANDOS DE OUTROS ESPORTES ==========

    async commandVolleyball(message) {
        console.log('🏐 Executando comando !svolley');
        
        const loadingMsg = await message.reply('🏐 Buscando jogos de volleyball...');
        
        try {
            const games = await this.fetchAPISportsData('volleyball', 'games');
            
            const embed = new EmbedBuilder()
                .setTitle('🏐 VOLLEYBALL')
                .setDescription('Principais campeonatos de volleyball')
                .setColor(0xff6b35)
                .setTimestamp()
                .setFooter({ text: `Smart Stream Bot - Volleyball` });

            embed.addFields(
                { 
                    name: '🇧🇷 SUPERLIGA BRASILEIRA', 
                    value: 'Masculino e Feminino\n📺 SporTV, Globo\n📱 CBV.com.br', 
                    inline: false 
                },
                { 
                    name: '🌍 LIGA DAS NAÇÕES', 
                    value: 'Competição internacional\n📺 SporTV, ESPN', 
                    inline: false 
                }
            );

            await loadingMsg.edit({ content: null, embeds: [embed] });
        } catch (error) {
            console.error('❌ Erro Volleyball:', error.message);
            await loadingMsg.edit({ content: '❌ Erro ao buscar dados de volleyball. Verifique a configuração da API.' });
        }
    }

    async commandNHL(message) {
        console.log('🏒 Executando comando !snhl');
        
        const loadingMsg = await message.reply('🏒 Buscando jogos da NHL...');
        
        try {
            const games = await this.fetchAPISportsData('hockey', '1'); // NHL league ID
            
            const embed = new EmbedBuilder()
                .setTitle('🏒 NHL - NATIONAL HOCKEY LEAGUE')
                .setDescription('Jogos da NHL de hoje')
                .setColor(0x005395)
                .setTimestamp()
                .setFooter({ text: `Smart Stream Bot - NHL` });

            if (games.length > 0) {
                const gamesList = games.map(game => 
                    `🕐 ${game.time} - **${game.homeTeam}** vs **${game.awayTeam}**\n📺 ESPN, NHL.tv`
                ).join('\n\n');
                
                embed.addFields({ name: '🏒 Jogos de Hoje', value: gamesList, inline: false });
            } else {
                embed.addFields({ 
                    name: '📅 Nenhum jogo hoje', 
                    value: 'Não há jogos da NHL programados para hoje.\n\n🔧 Configure API_SPORTS_TOKEN para dados reais.',
                    inline: false 
                });
            }

            await loadingMsg.edit({ content: null, embeds: [embed] });
        } catch (error) {
            console.error('❌ Erro NHL:', error.message);
            await loadingMsg.edit({ content: '❌ Erro ao buscar dados da NHL. Verifique a configuração da API.' });
        }
    }

    async commandMLB(message) {
        console.log('⚾ Executando comando !smlb');
        
        const loadingMsg = await message.reply('⚾ Buscando jogos da MLB...');
        
        try {
            const games = await this.fetchAPISportsData('baseball', '1'); // MLB league ID
            
            const embed = new EmbedBuilder()
                .setTitle('⚾ MLB - MAJOR LEAGUE BASEBALL')
                .setDescription('Jogos da MLB de hoje')
                .setColor(0x132448)
                .setTimestamp()
                .setFooter({ text: `Smart Stream Bot - MLB` });

            if (games.length > 0) {
                const gamesList = games.map(game => 
                    `🕐 ${game.time} - **${game.homeTeam}** vs **${game.awayTeam}**\n📺 ESPN, MLB.tv`
                ).join('\n\n');
                
                embed.addFields({ name: '⚾ Jogos de Hoje', value: gamesList, inline: false });
            } else {
                embed.addFields({ 
                    name: '📅 Temporada 2025', 
                    value: 'Temporada da MLB inicia em março/abril.\n\n📺 ESPN, Fox Sports\n📱 MLB.com\n\n🔧 Configure API_SPORTS_TOKEN para dados reais.',
                    inline: false 
                });
            }

            await loadingMsg.edit({ content: null, embeds: [embed] });
        } catch (error) {
            console.error('❌ Erro MLB:', error.message);
            await loadingMsg.edit({ content: '❌ Erro ao buscar dados da MLB. Verifique a configuração da API.' });
        }
    }

    async commandNFL(message) {
        console.log('🏈 Executando comando !snfl');
        
        const loadingMsg = await message.reply('🏈 Buscando jogos da NFL...');
        
        try {
            const games = await this.fetchAPISportsData('american_football', '1'); // NFL league ID
            
            const embed = new EmbedBuilder()
                .setTitle('🏈 NFL - NATIONAL FOOTBALL LEAGUE')
                .setDescription('Jogos da NFL de hoje')
                .setColor(0x013369)
                .setTimestamp()
                .setFooter({ text: `Smart Stream Bot - NFL` });

            if (games.length > 0) {
                const gamesList = games.map(game => 
                    `🕐 ${game.time} - **${game.homeTeam}** vs **${game.awayTeam}**\n📺 ESPN, NFL Network`
                ).join('\n\n');
                
                embed.addFields({ name: '🏈 Jogos de Hoje', value: gamesList, inline: false });
            } else {
                embed.addFields({ 
                    name: '🏆 PLAYOFFS NFL 2025', 
                    value: 'Playoffs em andamento!\n\n📺 ESPN, Fox Sports\n📱 NFL.com\n\n🔧 Configure API_SPORTS_TOKEN para dados reais.',
                    inline: false 
                });
            }

            await loadingMsg.edit({ content: null, embeds: [embed] });
        } catch (error) {
            console.error('❌ Erro NFL:', error.message);
            await loadingMsg.edit({ content: '❌ Erro ao buscar dados da NFL. Verifique a configuração da API.' });
        }
    }

    // ========== MÉTODO PRINCIPAL PARA API-SPORTS.IO ==========

    async fetchAPISportsData(sport, leagueId) {
        try {
            if (!this.config.apis.api_sports_token) {
                console.log('⚠️ API-Sports token não configurado');
                return [];
            }

            const today = new Date().toISOString().split('T')[0];
            const url = `https://api-sports.io/v1/${sport}/fixtures?date=${today}&league=${leagueId}`;

            const response = await axios.get(url, {
                headers: {
                    'X-API-KEY': this.config.apis.api_sports_token,
                },
                timeout: 8000
            });

            if (!response.data || !response.data.response) {
                console.log(`⚠️ API-Sports ${sport}: Nenhum jogo encontrado`);
                return [];
            }

            return response.data.response.slice(0, 5).map(fixture => ({
                time: new Date(fixture.fixture.date).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                homeTeam: fixture.teams.home.name,
                awayTeam: fixture.teams.away.name,
                status: fixture.fixture.status.long
            }));

        } catch (error) {
            console.error(`❌ Erro API-Sports ${sport}:`, error.message);
            if (error.message.includes('401')) {
                console.log('🔑 Configure API_SPORTS_TOKEN no Railway');
            }
            return [];
        }
    }
}

module.exports = SportsIntegration; 