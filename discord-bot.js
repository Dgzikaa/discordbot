const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

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
            
            // Verificar se é no canal correto
            if (message.channel.name !== this.channelName) return;
            
            // Verificar se é um comando que começa com !s
            if (!message.content.startsWith('!s')) return;
            
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
            
            // Streamers por categoria
            streamers: {
                cs2_br: ['gaules', 'fallen', 'coldzera', 'taco'],
                cs2_international: ['esl_csgo', 'blast', 'hltv_org'],
                futebol: ['casimito', 'loud_coringa', 'cosiq', 'warlillo', 'watos_', 'pagodedojorgin', 'dupladedoix', 'liraGOAT'],
                variety: ['cellbit', 'bauky']
            },
            
            // Campeonatos de futebol específicos
            football_championships: {
                nacionais: ['libertadores', 'brasileirao', 'estaduais'],
                internacionais: ['mundial', 'champions', 'ingles', 'frances', 'italiano'],
                copas: ['copa_do_mundo', 'copa_brasil', 'copa_america']
            },
            
            // Outros esportes
            other_sports: {
                tenis_mesa: ['hugo_calderano'],
                tenis_brasileiro: ['bia_haddad', 'thiago_monteiro'],
                basquete: ['nba'],
                eventos_especiais: ['copa_do_mundo', 'olimpiadas']
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
        console.log('\n📋 CONFIGURAÇÃO ATUAL:');
        console.log(`📺 Canal alvo: #${this.config.target_channel}`);
        console.log('🎮 CS2 Brasil:', this.config.streamers.cs2_br.join(', '));
        console.log('🏆 CS2 International:', this.config.streamers.cs2_international.join(', '));
        console.log('⚽ Futebol:', this.config.streamers.futebol.join(', '));
        console.log('📺 Variety:', this.config.streamers.variety.join(', '));
        
        console.log('\n🏆 CAMPEONATOS DE FUTEBOL:');
        console.log('🇧🇷 Nacionais:', this.config.football_championships.nacionais.join(', '));
        console.log('🌍 Internacionais:', this.config.football_championships.internacionais.join(', '));
        console.log('🏆 Copas:', this.config.football_championships.copas.join(', '));
        
        console.log('\n🏅 OUTROS ESPORTES:');
        console.log('🏓 Tênis de Mesa:', this.config.other_sports.tenis_mesa.join(', '));
        console.log('🎾 Tênis Brasileiro:', this.config.other_sports.tenis_brasileiro.join(', '));
        console.log('🏀 Basquete:', this.config.other_sports.basquete.join(', '));
        console.log('🌟 Eventos Especiais:', this.config.other_sports.eventos_especiais.join(', '));
        console.log('');
    }

    // Mostrar comandos disponíveis
    showAvailableCommands() {
        console.log('🤖 COMANDOS DISPONÍVEIS:');
        console.log('!saovivo - Verificar streamers online');
        console.log('!shoje - Jogos de hoje');
        console.log('!samanha - Jogos de amanhã');
        console.log('!ssemana - Jogos da semana');
        console.log('!sconfig - Configurações do bot');
        console.log('!shelp - Lista de comandos');
        console.log('!sping - Testar bot');
        console.log('!sstats - Estatísticas');
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
                    return await this.commandAoVivo(message);
                case '!shoje':
                    return await this.commandHoje(message);
                case '!samanha':
                    return await this.commandAmanha(message);
                case '!ssemana':
                    return await this.commandSemana(message);
                case '!sconfig':
                    return await this.commandConfig(message);
                case '!shelp':
                    return await this.commandHelp(message);
                case '!sping':
                    return await this.commandPing(message);
                case '!sstats':
                    return await this.commandStats(message);
                default:
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

    async commandAoVivo(message) {
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
        console.log('📅 Executando comando !shoje');
        
        const today = new Date();
        const todayStr = today.toLocaleDateString('pt-BR');

        const embed = new EmbedBuilder()
            .setTitle('⚽ JOGOS DE HOJE')
            .setDescription(`Jogos programados para ${todayStr}`)
            .setColor(0x00ff00)
            .setTimestamp()
            .setFooter({ text: `Smart Stream Bot - Canal #${this.config.target_channel}` });

        const fields = this.generateMockMatches('hoje');
        embed.addFields(fields);

        await message.reply({ embeds: [embed] });
    }

    async commandAmanha(message) {
        console.log('📅 Executando comando !samanha');
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toLocaleDateString('pt-BR');

        const embed = new EmbedBuilder()
            .setTitle('⚽ JOGOS DE AMANHÃ')
            .setDescription(`Jogos programados para ${tomorrowStr}`)
            .setColor(0x0099ff)
            .setTimestamp()
            .setFooter({ text: `Smart Stream Bot - Canal #${this.config.target_channel}` });

        const fields = this.generateMockMatches('amanha');
        embed.addFields(fields);

        await message.reply({ embeds: [embed] });
    }

    async commandSemana(message) {
        console.log('📅 Executando comando !ssemana');
        
        const embed = new EmbedBuilder()
            .setTitle('📅 JOGOS DA SEMANA')
            .setDescription('Principais jogos dos próximos 7 dias')
            .setColor(0x9900ff)
            .setTimestamp()
            .setFooter({ text: `Smart Stream Bot - Canal #${this.config.target_channel}` });

        const fields = this.generateMockMatches('semana');
        embed.addFields(fields);

        await message.reply({ embeds: [embed] });
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
        
        const embed = new EmbedBuilder()
            .setTitle('🤖 COMANDOS DISPONÍVEIS')
            .setDescription('Lista completa de comandos do Smart Stream Bot')
            .setColor(0x7289da)
            .setTimestamp()
            .setFooter({ text: `Smart Stream Bot - Canal #${this.config.target_channel}` })
            .addFields(
                { name: '📺 Streams', value: '`!saovivo` - Ver streamers online agora', inline: false },
                { name: '⚽ Futebol', value: '`!shoje` - Jogos de hoje\n`!samanha` - Jogos de amanhã\n`!ssemana` - Jogos da semana', inline: false },
                { name: '⚙️ Sistema', value: '`!sconfig` - Configurações do bot\n`!sstats` - Estatísticas\n`!sping` - Testar bot', inline: false },
                { name: '💡 Dica', value: 'Use os comandos neste canal para obter informações em tempo real!', inline: false }
            );

        await message.reply({ embeds: [embed] });
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

        // Relatório diário às 9h
        cron.schedule('0 9 * * *', async () => {
            await this.sendDailyReport();
        });

        // Primeira verificação em 10 segundos
        setTimeout(() => this.checkAllStreamers(), 10000);
        
        console.log('✅ Monitoramento ativo!');
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

            await this.sendWebhook(embed, content);
            
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

        await this.sendWebhook(embed, `📊 **Relatório Diário** - Bot ativo em #${this.config.target_channel}! Use \`!shelp\` para ver comandos.`);
    }

    // ========== HELPERS ==========

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
            cs2_br: 0x00ff41,      // Verde BR
            cs2_international: 0xff6600, // Laranja
            futebol: 0x00ff00,     // Verde
            variety: 0x9146ff      // Roxo Twitch
        };
        return colors[category] || 0x7289da;
    }

    getCategoryName(category) {
        const names = {
            cs2_br: 'CS2 Brasil',
            cs2_international: 'CS2 Internacional',
            futebol: 'Futebol',
            variety: 'Variety'
        };
        return names[category] || category;
    }

    getRandomCS2Title() {
        const titles = [
            'TREINO PARA O MAJOR 🏆',
            'RANKED COM A GALERA 🎮',
            'ANALISANDO DEMOS PRO 📊',
            'DEATHMATCH INFINITO 💀',
            'JOGANDO COM VIEWERS 👥'
        ];
        return titles[Math.floor(Math.random() * titles.length)];
    }

    getRandomFootballTitle() {
        const championships = [
            ...this.config.football_championships.nacionais,
            ...this.config.football_championships.internacionais,
            ...this.config.football_championships.copas
        ];
        
        const randomChampionship = championships[Math.floor(Math.random() * championships.length)];
        
        const titles = [
            `REAGINDO AO ${randomChampionship.toUpperCase()} ⚽`,
            `ANALISANDO LANCES DO ${randomChampionship.toUpperCase()} 📊`,
            `FALANDO SOBRE ${randomChampionship.toUpperCase()} 💰`,
            `ASSISTINDO ${randomChampionship.toUpperCase()} 🏆`,
            `PAPO FUTEBOL - ${randomChampionship.toUpperCase()} 💬`
        ];
        return titles[Math.floor(Math.random() * titles.length)];
    }

    getRandomVarietyTitle() {
        const titles = [
            'JUST CHATTING COM VOCÊS 💬',
            'REAGINDO A VÍDEOS 📹',
            'JOGANDO ALGO NOVO 🎮',
            'STREAM RELAX 😎',
            'INTERAGINDO COM CHAT 👋'
        ];
        return titles[Math.floor(Math.random() * titles.length)];
    }

    async sendWebhook(embed, content = null) {
        try {
            const payload = {
                username: 'Smart Stream Bot',
                avatar_url: 'https://cdn.discordapp.com/emojis/938415616628174849.png',
                embeds: [embed]
            };
            
            if (content) {
                payload.content = content;
            }

            await axios.post(this.webhookUrl, payload);
            console.log('✅ Notificação via webhook enviada');
        } catch (error) {
            console.error('❌ Erro ao enviar webhook:', error.message);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========== MÉTODOS PÚBLICOS ==========

    async start() {
        try {
            await this.client.login(this.token);
        } catch (error) {
            console.error('❌ Erro ao fazer login no Discord:', error);
            console.error('🔑 Verifique se o token do bot está correto');
        }
    }
}

module.exports = DiscordStreamBot; 