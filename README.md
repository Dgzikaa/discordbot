# 🤖 Smart Stream Bot

Bot Discord inteligente para monitoramento de streamers da Twitch e informações de jogos de futebol e esportes. Desenvolvido especificamente para o canal **#transmissões**.

## 🎯 Funcionalidades

### 📺 Monitoramento de Streams
- **Notificações automáticas** quando streamers ficam online
- **Monitoramento 24/7** de streamers categorizados
- **Cooldown inteligente** para evitar spam
- **Informações detalhadas** com viewers, tempo online e links

### 🤖 Sistema de Comandos
- **Comandos interativos** com respostas em tempo real
- **Prefixo único** `!s` para evitar conflitos
- **Cooldown anti-spam** de 15 segundos
- **Embeds bonitos** com informações organizadas

### 📅 Automação Diária
- **8h:** Resumo de jogos do dia
- **9h:** Relatório de configurações
- **A cada 3 min:** Verificação de streamers

## 🤖 Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `!shelp` | Lista todos os comandos disponíveis |
| `!saovivo` | Mostra streamers online no momento |
| `!shoje` | Jogos programados para hoje |
| `!samanha` | Jogos programados para amanhã |
| `!ssemana` | Jogos dos próximos 7 dias |
| `!sconfig` | Configurações atuais do bot |
| `!sping` | Testa se o bot está funcionando |
| `!sstats` | Estatísticas em tempo real |

## 📺 Streamers Monitorados

### 🇧🇷 CS2 Brasil
- gaules, fallen, coldzera, taco

### 🌍 CS2 Internacional  
- esl_csgo, blast, hltv_org

### ⚽ Futebol
- casimito, loud_coringa, cosiq, warlillo, watos_, pagodedojorgin, dupladedoix, liraGOAT

### 📺 Variety
- cellbit, bauky

## 🏆 Campeonatos Acompanhados

### 🇧🇷 Nacionais
- Libertadores, Brasileirão, Estaduais

### 🌍 Internacionais
- Mundial, Champions League, Inglês, Francês, Italiano

### 🏆 Copas
- Copa do Mundo, Copa do Brasil, Copa América

## 🏅 Outros Esportes

### 🏓 Tênis de Mesa
- Hugo Calderano

### 🎾 Tênis Brasileiro  
- Bia Haddad, Thiago Monteiro

### 🏀 Basquete
- NBA

### 🌟 Eventos Especiais
- Copa do Mundo, Olimpíadas

## ⚙️ Configurações

### 📺 Canal Alvo
- **#transmissões** (configurável)

### ⏰ Horários Ativos
- **8h às 23h** (monitoramento de streams)
- **24/7** (comandos sempre disponíveis)

### 🔔 Notificações
- **@everyone:** Ativado
- **Viewers mínimos:** 1.000
- **Cooldown:** 30 minutos
- **Thumbnails:** Ativadas

### 🤖 Comandos
- **Cooldown:** 15 segundos
- **Prefixo:** `!s`
- **Disponível para todos**

## 🚀 Como Usar

### 1️⃣ No Discord
Digite qualquer comando no canal **#transmissões**:
```
!shelp
```

### 2️⃣ Exemplo de Uso
```
!saovivo     → Ver quem está online
!shoje       → Jogos de hoje  
!samanha     → Jogos de amanhã
!ssemana     → Jogos da semana
```

## 🔧 Instalação e Deploy

### 📋 Pré-requisitos
- Node.js 18+
- Discord Bot Token
- Webhook URL

### 🛠️ Instalação Local
```bash
# Clonar repositório
git clone https://github.com/Dgzikaa/discordbot.git
cd discordbot

# Instalar dependências
npm install

# Configurar variáveis
export DISCORD_TOKEN="seu_token_aqui"

# Executar
npm start
```

### ☁️ Deploy no Railway

1. **Fork este repositório**
2. **Conecte ao Railway**
3. **Configure variável de ambiente:**
   - `DISCORD_TOKEN`: Token do seu bot Discord
4. **Deploy automático** ✅

### 🔗 Links Úteis
- **Adicionar Bot:** [Link de Convite](https://discord.com/oauth2/authorize?client_id=1377675126945878157&permissions=8&integration_type=0&scope=bot)
- **Railway:** [Deploy Grátis](https://railway.app)
- **Discord Developer:** [Criar Bot](https://discord.com/developers/applications)

## 📁 Estrutura do Projeto

```
discordbot/
├── discord-bot.js      # Bot principal com todas as funcionalidades
├── index.js           # Inicializador do bot
├── package.json       # Dependências e scripts
├── railway.json       # Configuração do Railway
├── bot-config.json    # Configurações persistentes (auto-gerado)
└── README.md          # Este arquivo
```

## 🔄 Funcionamento Automático

### 🌅 8h - Resumo Matinal
```
🌅 BOM DIA! JOGOS DE HOJE
📅 [Data completa]

🏆 Principais jogos do dia organizados por campeonato
💡 Comandos úteis para o dia
```

### 📊 9h - Relatório Técnico  
```
📊 Relatório Diário - Smart Bot
📈 Estatísticas de funcionamento
⚙️ Status das configurações
```

### 🔍 A cada 3 minutos
- Verificação de streamers online
- Notificações automáticas de lives
- Controle de cooldown

## 🛠️ Tecnologias

- **Discord.js v14** - Biblioteca do Discord
- **Node-cron** - Agendamento de tarefas  
- **Axios** - Requisições HTTP
- **Railway** - Hospedagem gratuita
- **Twitch API** (via DecAPI) - Dados de streams

## 📞 Suporte

- **Problema com comandos?** → Digite `!sping` para testar
- **Bot offline?** → Verifique logs no Railway
- **Streamers não detectados?** → API da Twitch pode estar instável

## 🎉 Recursos Especiais

### 🎨 Embeds Coloridos
- **🔴 Vermelho:** Streams ao vivo
- **🟢 Verde:** Jogos de hoje
- **🔵 Azul:** Jogos de amanhã  
- **🟣 Roxo:** Jogos da semana
- **🟠 Laranja:** Resumo matinal

### 🏷️ Categorização Inteligente
- Streamers organizados por categoria
- Jogos agrupados por campeonato
- Estatísticas separadas por tipo

### ⚡ Performance Otimizada
- Rate limiting para APIs
- Cooldowns inteligentes
- Verificações apenas em horário ativo
- Cache de notificações

---

**🤖 Smart Stream Bot** - Desenvolvido com ❤️ para a comunidade de streams e esportes! 