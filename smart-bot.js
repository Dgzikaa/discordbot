const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

class SmartStreamBot {
    constructor(webhookUrl, channelName = 'transmissões') {
        this.webhookUrl = webhookUrl;
        this.channelName = channelName;
        this.configFile = 'bot-config.json';
        this.activeStreams = new Map();
        this.lastNotifications = new Map();
        this.commandCooldowns = new Map();
        
        // Carregar configurações salvas
        this.loadConfig();
        
        console.log(`🧠 Smart Stream Bot iniciado para canal: #${this.channelName}!`);
        this.showCurrentConfig();
        this.showAvailableCommands();
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
            
            // Torneios de CS2
            cs2_tournaments: [
                'major',
                'esl_pro_league',
                'blast_premier',
                'iem'
            ],
            
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
                cooldown_seconds: 30,
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
        console.log('!aovivo - Verificar streamers online');
        console.log('!hoje - Jogos de hoje');
        console.log('!amanha - Jogos de amanhã');
        console.log('!semana - Jogos da semana');
        console.log('!config - Configurações do bot');
        console.log('!help - Lista de comandos');
        console.log('!ping - Testar bot');
        console.log('!stats - Estatísticas');
        console.log('');
    }

    // ========== SISTEMA DE COMANDOS ==========

    async processCommand(commandText, userMention = null) {
        if (!this.config.commands.enabled) return;

        const command = commandText.toLowerCase().trim();
        
        // Verificar cooldown
        const userId = userMention || 'system';
        if (this.isOnCooldown(userId, command)) {
            return this.sendCommandResponse('⏳ Aguarde um pouco antes de usar este comando novamente!');
        }

        this.setCooldown(userId, command);

        switch (command) {
            case '!aovivo':
                return await this.commandAoVivo();
            case '!hoje':
                return await this.commandHoje();
            case '!amanha':
                return await this.commandAmanha();
            case '!semana':
                return await this.commandSemana();
            case '!config':
                return await this.commandConfig();
            case '!help':
                return await this.commandHelp();
            case '!ping':
                return await this.commandPing();
            case '!stats':
                return await this.commandStats();
            default:
                return null; // Comando não reconhecido
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

    async commandAoVivo() {
        console.log('🔍 Executando comando !aovivo');
        
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

        const embed = {
            title: '🔴 STREAMERS AO VIVO AGORA',
            description: liveStreamers.length > 0 ? 
                `${liveStreamers.length} streamer(s) online no momento:` : 
                'Nenhum streamer monitorado está online no momento.',
            color: 0xff0000,
            timestamp: new Date().toISOString(),
            fields: [],
            footer: {
                text: `Smart Stream Bot - Canal #${this.config.target_channel}`
            }
        };

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

                embed.fields.push({
                    name: `${this.getCategoryEmoji(category)} ${categoryName}`,
                    value: streamList,
                    inline: false
                });
            }
        }

        return this.sendCommandResponse(null, embed);
    }

    async commandHoje() {
        console.log('📅 Executando comando !hoje');
        
        const today = new Date();
        const todayStr = today.toLocaleDateString('pt-BR');

        const embed = {
            title: '⚽ JOGOS DE HOJE',
            description: `Jogos programados para ${todayStr}`,
            color: 0x00ff00,
            timestamp: new Date().toISOString(),
            fields: this.generateMockMatches('hoje'),
            footer: {
                text: `Smart Stream Bot - Canal #${this.config.target_channel}`
            }
        };

        return this.sendCommandResponse(null, embed);
    }

    async commandAmanha() {
        console.log('📅 Executando comando !amanha');
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toLocaleDateString('pt-BR');

        const embed = {
            title: '⚽ JOGOS DE AMANHÃ',
            description: `Jogos programados para ${tomorrowStr}`,
            color: 0x0099ff,
            timestamp: new Date().toISOString(),
            fields: this.generateMockMatches('amanha'),
            footer: {
                text: `Smart Stream Bot - Canal #${this.config.target_channel}`
            }
        };

        return this.sendCommandResponse(null, embed);
    }

    async commandSemana() {
        console.log('📅 Executando comando !semana');
        
        const embed = {
            title: '📅 JOGOS DA SEMANA',
            description: 'Principais jogos dos próximos 7 dias',
            color: 0x9900ff,
            timestamp: new Date().toISOString(),
            fields: this.generateMockMatches('semana'),
            footer: {
                text: `Smart Stream Bot - Canal #${this.config.target_channel}`
            }
        };

        return this.sendCommandResponse(null, embed);
    }

    async commandConfig() {
        console.log('⚙️ Executando comando !config');
        
        const totalStreamers = Object.values(this.config.streamers).flat().length;
        const totalChampionships = Object.values(this.config.football_championships).flat().length;
        
        const embed = {
            title: '⚙️ CONFIGURAÇÕES DO BOT',
            description: `Configurações atuais do Smart Stream Bot`,
            color: 0xffaa00,
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: '📺 Canal Alvo',
                    value: `#${this.config.target_channel}`,
                    inline: true
                },
                {
                    name: '🎮 Total Streamers',
                    value: totalStreamers.toString(),
                    inline: true
                },
                {
                    name: '⚽ Campeonatos',
                    value: totalChampionships.toString(),
                    inline: true
                },
                {
                    name: '👥 Viewers Mínimos',
                    value: this.config.notifications.min_viewers.toLocaleString('pt-BR'),
                    inline: true
                },
                {
                    name: '⏰ Cooldown',
                    value: `${this.config.notifications.cooldown_minutes} min`,
                    inline: true
                },
                {
                    name: '🕐 Horário Ativo',
                    value: `${this.config.active_hours.start}h - ${this.config.active_hours.end}h`,
                    inline: true
                }
            ],
            footer: {
                text: `Smart Stream Bot - Canal #${this.config.target_channel}`
            }
        };

        return this.sendCommandResponse(null, embed);
    }

    async commandHelp() {
        console.log('❓ Executando comando !help');
        
        const embed = {
            title: '🤖 COMANDOS DISPONÍVEIS',
            description: 'Lista completa de comandos do Smart Stream Bot',
            color: 0x7289da,
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: '📺 Streams',
                    value: '`!aovivo` - Ver streamers online agora',
                    inline: false
                },
                {
                    name: '⚽ Futebol',
                    value: '`!hoje` - Jogos de hoje\n`!amanha` - Jogos de amanhã\n`!semana` - Jogos da semana',
                    inline: false
                },
                {
                    name: '⚙️ Sistema',
                    value: '`!config` - Configurações do bot\n`!stats` - Estatísticas\n`!ping` - Testar bot',
                    inline: false
                },
                {
                    name: '💡 Dica',
                    value: 'Use os comandos no canal para obter informações em tempo real!',
                    inline: false
                }
            ],
            footer: {
                text: `Smart Stream Bot - Canal #${this.config.target_channel}`
            }
        };

        return this.sendCommandResponse(null, embed);
    }

    async commandPing() {
        console.log('🏓 Executando comando !ping');
        
        const embed = {
            title: '🏓 PONG!',
            description: 'Smart Stream Bot está funcionando perfeitamente!',
            color: 0x00ff41,
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: '✅ Status',
                    value: 'Online e monitorando',
                    inline: true
                },
                {
                    name: '📊 Uptime',
                    value: 'Funcionando 24/7',
                    inline: true
                },
                {
                    name: '📺 Canal',
                    value: `#${this.config.target_channel}`,
                    inline: true
                }
            ],
            footer: {
                text: `Smart Stream Bot - Respondido em ${new Date().toLocaleTimeString('pt-BR')}`
            }
        };

        return this.sendCommandResponse(null, embed);
    }

    async commandStats() {
        console.log('📊 Executando comando !stats');
        
        const totalStreamers = Object.values(this.config.streamers).flat().length;
        const activeStreamsCount = this.activeStreams.size;
        const totalChampionships = Object.values(this.config.football_championships).flat().length;
        const totalSports = Object.values(this.config.other_sports).flat().length;
        
        const embed = {
            title: '📊 ESTATÍSTICAS DO BOT',
            description: 'Estatísticas em tempo real do Smart Stream Bot',
            color: 0xff6600,
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: '🎮 Streamers Monitorados',
                    value: totalStreamers.toString(),
                    inline: true
                },
                {
                    name: '🔴 Streams Ativas',
                    value: activeStreamsCount.toString(),
                    inline: true
                },
                {
                    name: '⚽ Campeonatos',
                    value: totalChampionships.toString(),
                    inline: true
                },
                {
                    name: '🏅 Outros Esportes',
                    value: totalSports.toString(),
                    inline: true
                },
                {
                    name: '📺 Canal Alvo',
                    value: `#${this.config.target_channel}`,
                    inline: true
                },
                {
                    name: '⏰ Próxima Verificação',
                    value: 'Em até 3 minutos',
                    inline: true
                }
            ],
            footer: {
                text: `Smart Stream Bot - Atualizado ${new Date().toLocaleString('pt-BR')}`
            }
        };

        return this.sendCommandResponse(null, embed);
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

    // Enviar resposta de comando
    async sendCommandResponse(content = null, embed = null) {
        try {
            const payload = {
                username: 'Smart Stream Bot',
                avatar_url: 'https://cdn.discordapp.com/emojis/938415616628174849.png'
            };
            
            if (content) payload.content = content;
            if (embed) payload.embeds = [embed];

            await axios.post(this.webhookUrl, payload);
            console.log('✅ Resposta de comando enviada');
            return true;
        } catch (error) {
            console.error('❌ Erro ao enviar resposta:', error.message);
            return false;
        }
    }

    // ========== MÉTODOS DE CONFIGURAÇÃO ==========

    // Adicionar streamer
    addStreamer(category, streamerName) {
        if (!this.config.streamers[category]) {
            this.config.streamers[category] = [];
        }
        
        if (!this.config.streamers[category].includes(streamerName)) {
            this.config.streamers[category].push(streamerName);
            this.saveConfig();
            console.log(`✅ Streamer ${streamerName} adicionado à categoria ${category}`);
            return true;
        } else {
            console.log(`⚠️ Streamer ${streamerName} já existe na categoria ${category}`);
            return false;
        }
    }

    // Remover streamer
    removeStreamer(category, streamerName) {
        if (this.config.streamers[category]) {
            const index = this.config.streamers[category].indexOf(streamerName);
            if (index > -1) {
                this.config.streamers[category].splice(index, 1);
                this.saveConfig();
                console.log(`❌ Streamer ${streamerName} removido da categoria ${category}`);
                return true;
            }
        }
        console.log(`⚠️ Streamer ${streamerName} não encontrado na categoria ${category}`);
        return false;
    }

    // Adicionar campeonato de futebol
    addFootballChampionship(type, championship) {
        if (!this.config.football_championships[type]) {
            this.config.football_championships[type] = [];
        }
        
        if (!this.config.football_championships[type].includes(championship)) {
            this.config.football_championships[type].push(championship);
            this.saveConfig();
            console.log(`✅ Campeonato ${championship} adicionado ao tipo ${type}`);
            return true;
        }
        return false;
    }

    // Adicionar esporte
    addOtherSport(sportType, item) {
        if (!this.config.other_sports[sportType]) {
            this.config.other_sports[sportType] = [];
        }
        
        if (!this.config.other_sports[sportType].includes(item)) {
            this.config.other_sports[sportType].push(item);
            this.saveConfig();
            console.log(`✅ ${item} adicionado ao esporte ${sportType}`);
            return true;
        }
        return false;
    }

    // Configurar notificações
    setNotificationConfig(setting, value) {
        if (this.config.notifications.hasOwnProperty(setting)) {
            this.config.notifications[setting] = value;
            this.saveConfig();
            console.log(`✅ ${setting} configurado para ${value}`);
            return true;
        }
        return false;
    }

    // Configurar canal alvo
    setTargetChannel(channelName) {
        this.config.target_channel = channelName;
        this.channelName = channelName;
        this.saveConfig();
        console.log(`✅ Canal alvo configurado para: #${channelName}`);
        return true;
    }

    // ========== MONITORAMENTO ==========

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
                        value: 'Use `!aovivo` para ver todos online',
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
            console.log('✅ Notificação enviada');
        } catch (error) {
            console.error('❌ Erro ao enviar webhook:', error.message);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========== MÉTODOS PÚBLICOS ==========

    start() {
        console.log(`🚀 Iniciando Smart Stream Bot para canal #${this.config.target_channel}...`);
        
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
        
        console.log('✅ Smart Stream Bot ativo!');
        console.log('🤖 Sistema de comandos habilitado!');
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
                    value: '!aovivo, !hoje, !amanha, !semana, !help',
                    inline: false
                }
            ],
            footer: {
                text: 'Smart Stream Bot - Relatório Diário'
            }
        };

        await this.sendWebhook(embed, `📊 **Relatório Diário** - Bot ativo em #${this.config.target_channel}! Use \`!help\` para ver comandos.`);
    }
}

module.exports = SmartStreamBot; 