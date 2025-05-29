const SmartStreamBot = require('./smart-bot');

// Configuração do webhook
const webhookUrl = 'https://discord.com/api/webhooks/1377661868167921775/xIchvvYX8rmiRaZerEsIKIx_OuQ0V1fMuoRoSM9l0O3tffl2BBl-apOTU4mG5ekzaLLn';

// Criar instância do Smart Bot (canal padrão: transmissões)
const smartBot = new SmartStreamBot(webhookUrl, 'transmissões');

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
                console.log('💡 Exemplo: node smart-start.js add-streamer futebol cosiq');
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

        case 'add-championship':
            if (!arg1 || !arg2) {
                console.log('❌ Uso: node smart-start.js add-championship <tipo> <campeonato>');
                console.log('📝 Tipos: nacionais, internacionais, copas');
                console.log('💡 Exemplo: node smart-start.js add-championship nacionais libertadores');
                return;
            }
            smartBot.addFootballChampionship(arg1, arg2);
            break;

        case 'add-sport':
            if (!arg1 || !arg2) {
                console.log('❌ Uso: node smart-start.js add-sport <tipo_esporte> <item>');
                console.log('📝 Tipos: tenis_mesa, tenis_brasileiro, basquete, eventos_especiais');
                console.log('💡 Exemplo: node smart-start.js add-sport tenis_mesa hugo_calderano');
                return;
            }
            smartBot.addOtherSport(arg1, arg2);
            break;

        case 'set-channel':
            if (!arg1) {
                console.log('❌ Uso: node smart-start.js set-channel <nome_canal>');
                console.log('💡 Exemplo: node smart-start.js set-channel transmissões');
                return;
            }
            smartBot.setTargetChannel(arg1);
            break;

        case 'config':
            if (!arg1 || !arg2) {
                console.log('❌ Uso: node smart-start.js config <setting> <value>');
                console.log('📝 Settings disponíveis:');
                console.log('  • ping_everyone (true/false)');
                console.log('  • min_viewers (número)');
                console.log('  • cooldown_minutes (número)');
                console.log('  • include_thumbnails (true/false)');
                console.log('  • mention_channel (true/false)');
                console.log('💡 Exemplo: node smart-start.js config min_viewers 5000');
                return;
            }
            
            let value = arg2;
            if (arg2 === 'true') value = true;
            if (arg2 === 'false') value = false;
            if (!isNaN(arg2)) value = parseInt(arg2);
            
            smartBot.setNotificationConfig(arg1, value);
            break;

        case 'setup-complete':
            console.log('🎯 Configurando bot completo com suas especificações...');
            await setupComplete();
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

async function setupComplete() {
    console.log('⚙️ Configurando canal para transmissões...');
    smartBot.setTargetChannel('transmissões');
    
    console.log('🎮 Streamers já incluídos automaticamente:');
    console.log('⚽ Futebol: cosiq, warlillo, watos_, pagodedojorgin, dupladedoix, liraGOAT');
    
    console.log('🏆 Campeonatos configurados:');
    console.log('🇧🇷 Nacionais: libertadores, brasileirao, estaduais');
    console.log('🌍 Internacionais: mundial, champions, ingles, frances, italiano');
    console.log('🏆 Copas: copa_do_mundo, copa_brasil, copa_america');
    
    console.log('🏅 Esportes configurados:');
    console.log('🏓 Tênis de Mesa: hugo_calderano');
    console.log('🎾 Tênis Brasileiro: bia_haddad, thiago_monteiro');
    console.log('🏀 Basquete: nba');
    console.log('🌟 Eventos: copa_do_mundo, olimpiadas');
    
    console.log('✅ Configuração completa finalizada!');
    console.log('🚀 Execute: node smart-start.js start');
}

async function testNotification() {
    try {
        const testEmbed = {
            title: '🧪 TESTE - Smart Stream Bot',
            description: 'Esta é uma mensagem de teste para o canal #transmissões!',
            color: 0x00ff41,
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: '✅ Status',
                    value: 'Webhook funcionando perfeitamente!',
                    inline: true
                },
                {
                    name: '📺 Canal Alvo',
                    value: '#transmissões',
                    inline: true
                },
                {
                    name: '🕐 Teste realizado em',
                    value: new Date().toLocaleString('pt-BR'),
                    inline: true
                },
                {
                    name: '⚽ Novos Streamers',
                    value: 'cosiq, warlillo, watos_, pagodedojorgin, dupladedoix, liraGOAT',
                    inline: false
                },
                {
                    name: '🏆 Campeonatos Monitorados',
                    value: 'libertadores, mundial, brasileirao, estaduais, champions, ingles, frances, italiano',
                    inline: false
                },
                {
                    name: '🎯 Próximo passo',
                    value: 'Execute: node smart-start.js start',
                    inline: false
                }
            ],
            footer: {
                text: 'Smart Stream Bot - Teste para Transmissões'
            }
        };

        await smartBot.sendWebhook(testEmbed, '🧪 **TESTE** - Bot configurado para #transmissões!');
        console.log('✅ Teste enviado! Verifique o canal #transmissões no Discord.');
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
  node smart-start.js setup-complete           - Configuração completa automática

⚙️ CONFIGURAÇÃO DE STREAMERS:
  node smart-start.js add-streamer futebol cosiq           - Adicionar streamer
  node smart-start.js remove-streamer futebol cosiq        - Remover streamer
  node smart-start.js set-channel transmissões             - Definir canal alvo

🏆 CAMPEONATOS E ESPORTES:
  node smart-start.js add-championship nacionais libertadores     - Adicionar campeonato
  node smart-start.js add-sport tenis_mesa hugo_calderano         - Adicionar esporte

🔧 CONFIGURAÇÕES:
  node smart-start.js config ping_everyone true           - Ativar @everyone
  node smart-start.js config min_viewers 5000             - Mín. de viewers
  node smart-start.js config cooldown_minutes 60          - Cooldown em min
  node smart-start.js config include_thumbnails false     - Desativar thumbs
  node smart-start.js config mention_channel true         - Mencionar canal

📋 INFORMAÇÕES:
  node smart-start.js show-config              - Mostrar configuração atual
  node smart-start.js reset                    - Resetar para padrão
  node smart-start.js help                     - Mostrar esta ajuda

📂 CATEGORIAS DE STREAMERS:
  • cs2_br                - CS2 streamers brasileiros
  • cs2_international     - CS2 streamers internacionais  
  • futebol              - Streamers de futebol (já inclui os novos!)
  • variety              - Streamers variety

🏆 TIPOS DE CAMPEONATOS:
  • nacionais            - libertadores, brasileirao, estaduais
  • internacionais       - mundial, champions, ingles, frances, italiano
  • copas                - copa_do_mundo, copa_brasil, copa_america

🏅 TIPOS DE ESPORTES:
  • tenis_mesa           - hugo_calderano
  • tenis_brasileiro     - bia_haddad, thiago_monteiro
  • basquete            - nba
  • eventos_especiais   - copa_do_mundo, olimpiadas

📺 CONFIGURAÇÃO ATUAL:
  ✅ Canal alvo: #transmissões
  ✅ Novos streamers: cosiq, warlillo, watos_, pagodedojorgin, dupladedoix, liraGOAT
  ✅ Campeonatos completos de futebol configurados
  ✅ Tênis de mesa (Hugo Calderano), tênis brasileiro, NBA, Copa do Mundo

💡 QUICK START:
  1. node smart-start.js test           # Testar primeiro
  2. node smart-start.js start          # Iniciar o bot
  
🎯 SETUP RÁPIDO:
  node smart-start.js setup-complete    # Configurar tudo automaticamente
`);
}

// Executar comando se fornecido, senão mostrar ajuda
if (command) {
    handleCommand().catch(console.error);
} else {
    showHelp();
} 