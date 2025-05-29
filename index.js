const DiscordStreamBot = require('./discord-bot');

// Configurações
const token = process.env.DISCORD_TOKEN || 'SEU_TOKEN_AQUI';
const webhookUrl = 'https://discord.com/api/webhooks/1377661868167921775/xIchvvYX8rmiRaZerEsIKIx_OuQ0V1fMuoRoSM9l0O3tffl2BBl-apOTU4mG5ekzaLLn';
const channelName = 'transmissões';

console.log('🚀 Iniciando Discord Stream Bot...');

// Criar e iniciar o bot
const bot = new DiscordStreamBot(token, webhookUrl, channelName);
bot.start();

// Tratamento de erros globais
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
}); 