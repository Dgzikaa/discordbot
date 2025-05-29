const DiscordStreamBot = require('./discord-bot');
const http = require('http');

// Configurações
const token = process.env.DISCORD_TOKEN || 'SEU_TOKEN_AQUI';
const webhookUrl = 'https://discord.com/api/webhooks/1377661868167921775/xIchvvYX8rmiRaZerEsIKIx_OuQ0V1fMuoRoSM9l0O3tffl2BBl-apOTU4mG5ekzaLLn';
const channelName = 'transmissões';

console.log('🚀 Iniciando Discord Stream Bot...');

// Criar e iniciar o bot
const bot = new DiscordStreamBot(token, webhookUrl, channelName);
bot.start();

// Criar servidor HTTP para healthcheck
const server = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'healthy', 
            service: 'discord-bot',
            timestamp: new Date().toISOString()
        }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor HTTP rodando na porta ${PORT}`);
    console.log(`🔍 Healthcheck disponível em: http://localhost:${PORT}/health`);
});

// Tratamento de erros globais
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
}); 