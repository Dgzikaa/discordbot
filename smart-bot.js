const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

class SmartStreamBot {
    constructor(webhookUrl) {
        this.webhookUrl = webhookUrl;
        this.configFile = 'bot-config.json';
        this.activeStreams = new Map();
        this.lastNotifications = new Map();
        
        // Carregar configurações salvas
        this.loadConfig();
        
        console.log('🧠 Smart Stream Bot iniciado!');
        this.showCurrentConfig();
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
            // Streamers por categoria
            streamers: {
                cs2_br: ['gaules', 'fallen', 'coldzera', 'taco'],
                cs2_international: ['esl_csgo', 'blast', 'hltv_org'],
                futebol: ['casimito', 'loud_coringa'],
                variety: ['cellbit', 'bauky']
            },
            
            // Campeonatos de futebol
            football_leagues: [
                'brasileirao',
                'premier_league', 
                'champions_league',
                'copa_brasil'
            ],
            
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
                include_thumbnails: true
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
        console.log('🎮 CS2 Brasil:', this.config.streamers.cs2_br.join(', '));
        console.log('🏆 CS2 International:', this.config.streamers.cs2_international.join(', '));
        console.log('⚽ Futebol:', this.config.streamers.futebol.join(', '));
        console.log('📺 Variety:', this.config.streamers.variety.join(', '));
        console.log('🏆 Ligas de Futebol:', this.config.football_leagues.join(', '));
        console.log('🎯 Torneios CS2:', this.config.cs2_tournaments.join(', '));
        console.log('');
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

    // Adicionar liga de futebol
    addFootballLeague(league) {
        if (!this.config.football_leagues.includes(league)) {
            this.config.football_leagues.push(league);
            this.saveConfig();
            console.log(`✅ Liga ${league} adicionada`);
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
            }
            
        } catch (error) {
            console.error(`❌ Erro ao verificar ${streamer}:`, error.message);
        }
    }

    // Verificar se deve notificar (cooldown)
    shouldNotify(streamer) {
        const lastNotification = this.lastNotifications.get(streamer);
        if (!lastNotification) return true;
        
        const cooldownMs = this.config.notifications.cooldown_minutes * 60 * 1000;
        return (Date.now() - lastNotification) > cooldownMs;
    }

    async notifyStreamerOnline(streamer, category) {
        try {
            // Buscar informações da stream
            const streamInfo = await this.getStreamInfo(streamer, category);
            
            // Verificar viewers mínimos
            if (streamInfo.viewers < this.config.notifications.min_viewers) {
                console.log(`⏭️ ${streamer} tem poucos viewers (${streamInfo.viewers}), pulando notificação`);
                return;
            }

            const embed = {
                title: `🔴 ${this.getCategoryEmoji(category)} STREAM AO VIVO!`,
                description: `**${streamer}** acabou de ficar online!`,
                color: this.getCategoryColor(category),
                timestamp: new Date().toISOString(),
                fields: [
                    {
                        name: '📝 Título',
                        value: streamInfo.title || 'Título não disponível',
                        inline: false
                    },
                    {
                        name: '🎮 Jogo',
                        value: streamInfo.game || 'Não informado',
                        inline: true
                    },
                    {
                        name: '👥 Viewers',
                        value: streamInfo.viewers.toLocaleString(),
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
                    }
                ],
                footer: {
                    text: 'Smart Stream Bot'
                }
            };

            if (this.config.notifications.include_thumbnails && streamInfo.thumbnail) {
                embed.thumbnail = { url: streamInfo.thumbnail };
            }

            const content = this.config.notifications.ping_everyone ? 
                `🚨 **@everyone** ${streamer} está ao vivo!` : null;

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
        const titles = [
            'REAGINDO AO BRASILEIRÃO ⚽',
            'ANALISANDO OS LANCES 📊',
            'FALANDO SOBRE TRANSFERÊNCIAS 💰',
            'ASSISTINDO CHAMPIONS LEAGUE 🏆',
            'PAPO FUTEBOL COM CHAT 💬'
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
        console.log('🚀 Iniciando Smart Stream Bot...');
        
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
    }

    async sendDailyReport() {
        const totalStreamers = Object.values(this.config.streamers).flat().length;
        
        const embed = {
            title: '📊 Relatório Diário - Smart Bot',
            description: 'Resumo das configurações e atividades',
            color: 0x00ff41,
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: '📺 Total de Streamers',
                    value: totalStreamers.toString(),
                    inline: true
                },
                {
                    name: '⚽ Ligas de Futebol',
                    value: this.config.football_leagues.length.toString(),
                    inline: true
                },
                {
                    name: '🎮 Categorias Ativas',
                    value: Object.keys(this.config.streamers).length.toString(),
                    inline: true
                }
            ],
            footer: {
                text: 'Smart Stream Bot - Relatório Diário'
            }
        };

        await this.sendWebhook(embed);
    }
}

module.exports = SmartStreamBot; 