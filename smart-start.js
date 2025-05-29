const SmartStreamBot = require('./smart-bot');

// Configuração do webhook
const webhookUrl = 'https://discord.com/api/webhooks/1377661868167921775/xIchvvYX8rmiRaZerEsIKIx_OuQ0V1fMuoRoSM9l0O3tffl2BBl-apOTU4mG5ekzaLLn';

// Criar instância do Smart Bot
const smartBot = new SmartStreamBot(webhookUrl);

// Comandos de linha de comando para configuração
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];
const arg3 = process.argv[5];

async function handleCommand() {
    switch (command) {
        case 'start':
            console.log('🚀 Iniciando Smart Stream Bot...');
            smartBot.start();
            break;

        case 'add-streamer':
            if (!arg1 || !arg2) {
                console.log('❌ Uso: node smart-start.js add-streamer <categoria> <nome_streamer>');
                console.log('📝 Categorias: cs2_br, cs2_international, futebol, variety');
                console.log('💡 Exemplo: node smart-start.js add-streamer cs2_br loud_fallen');
                return;
            }
            smartBot.addStreamer(arg1, arg2);
            break;

        case 'remove-streamer':
            if (!arg1 || !arg2) {
                console.log('❌ Uso: node smart-start.js remove-streamer <categoria> <nome_streamer>');
                return;
            }
            smartBot.removeStreamer(arg1, arg2);
            break;

        case 'add-league':
            if (!arg1) {
                console.log('❌ Uso: node smart-start.js add-league <nome_liga>');
                console.log('💡 Exemplo: node smart-start.js add-league libertadores');
                return;
            }
            smartBot.addFootballLeague(arg1);
            break;

        case 'config':
            if (!arg1 || !arg2) {
                console.log('❌ Uso: node smart-start.js config <setting> <value>');
                console.log('📝 Settings disponíveis:');
                console.log('  • ping_everyone (true/false)');
                console.log('  • min_viewers (número)');
                console.log('  • cooldown_minutes (número)');
                console.log('  • include_thumbnails (true/false)');
                console.log('💡 Exemplo: node smart-start.js config min_viewers 5000');
                return;
            }
            
            let value = arg2;
            if (arg2 === 'true') value = true;
            if (arg2 === 'false') value = false;
            if (!isNaN(arg2)) value = parseInt(arg2);
            
            smartBot.setNotificationConfig(arg1, value);
            break;

        case 'show-config':
            smartBot.showCurrentConfig();
            break;

        case 'reset':
            console.log('🔄 Resetando configurações para padrão...');
            smartBot.resetToDefaults();
            console.log('✅ Configurações resetadas!');
            break;

        case 'test':
            console.log('🧪 Testando notificação...');
            await testNotification();
            break;

        case 'help':
        default:
            showHelp();
            break;
    }
}

async function testNotification() {
    try {
        const testEmbed = {
            title: '🧪 TESTE - Smart Stream Bot',
            description: 'Esta é uma mensagem de teste para verificar se o webhook está funcionando!',
            color: 0x00ff41,
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: '✅ Status',
                    value: 'Webhook funcionando perfeitamente!',
                    inline: true
                },
                {
                    name: '🕐 Teste realizado em',
                    value: new Date().toLocaleString('pt-BR'),
                    inline: true
                },
                {
                    name: '🎯 Próximo passo',
                    value: 'Execute: node smart-start.js start',
                    inline: false
                }
            ],
            footer: {
                text: 'Smart Stream Bot - Teste'
            }
        };

        await smartBot.sendWebhook(testEmbed);
        console.log('✅ Teste enviado! Verifique seu canal Discord.');
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

function showHelp() {
    console.log(`
🧠 SMART STREAM BOT - Comandos Disponíveis

📖 INICIALIZAÇÃO:
  node smart-start.js start                    - Iniciar o bot
  node smart-start.js test                     - Testar webhook

⚙️ CONFIGURAÇÃO DE STREAMERS:
  node smart-start.js add-streamer cs2_br gaules          - Adicionar streamer
  node smart-start.js remove-streamer cs2_br gaules       - Remover streamer
  node smart-start.js add-league libertadores             - Adicionar liga

🔧 CONFIGURAÇÕES:
  node smart-start.js config ping_everyone true           - Ativar @everyone
  node smart-start.js config min_viewers 5000             - Mín. de viewers
  node smart-start.js config cooldown_minutes 60          - Cooldown em min
  node smart-start.js config include_thumbnails false     - Desativar thumbs

📋 INFORMAÇÕES:
  node smart-start.js show-config              - Mostrar configuração atual
  node smart-start.js reset                    - Resetar para padrão
  node smart-start.js help                     - Mostrar esta ajuda

📂 CATEGORIAS DISPONÍVEIS:
  • cs2_br                - CS2 streamers brasileiros
  • cs2_international     - CS2 streamers internacionais  
  • futebol              - Streamers de futebol
  • variety              - Streamers variety

💡 EXEMPLOS PRÁTICOS:
  node smart-start.js add-streamer cs2_br loud_fallen
  node smart-start.js config min_viewers 2000
  node smart-start.js start

🎯 DICA: Execute 'node smart-start.js test' primeiro para verificar se funciona!
`);
}

// Executar comando se fornecido, senão mostrar ajuda
if (command) {
    handleCommand().catch(console.error);
} else {
    showHelp();
} 