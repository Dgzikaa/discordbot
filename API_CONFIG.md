# 🔌 **Configuração de APIs Reais**

## 📊 **Situação Atual vs Futuro**

### ❌ **ANTES - Dados Fictícios:**
```
16:00 - Flamengo vs Palmeiras
18:00 - Real Madrid vs Barcelona  
```

### ✅ **AGORA - Dados Reais + Canais de TV:**
```
16:00 - Flamengo vs Palmeiras
📺 Globo, SporTV | 📱 Globoplay, Premiere

18:00 - Real Madrid vs Barcelona  
📺 SBT, TNT Sports | 📱 HBO Max, Paramount+
```

## 🔑 **APIs Recomendadas**

### 1️⃣ **Futebol Brasileiro - API-FOOTBALL**
- **Site:** [rapidapi.com/api-sports/api/api-football](https://rapidapi.com/api-sports/api/api-football)
- **Preço:** 100 requests/mês GRÁTIS
- **Dados:** Brasileirão, Libertadores, Copa do Brasil
- **Canais:** Globo, SporTV, Premiere

```bash
# Configurar no Railway:
FOOTBALL_API_KEY=sua_chave_aqui
```

### 2️⃣ **Champions League - UEFA API**
- **Site:** [football-data.org](https://www.football-data.org)
- **Preço:** 10 requests/min GRÁTIS
- **Dados:** Champions, Europa League
- **Canais:** SBT, TNT Sports, HBO Max

```bash
# Configurar no Railway:
UEFA_API_KEY=sua_chave_aqui
```

### 3️⃣ **NBA - RapidAPI Sports**
- **Site:** [rapidapi.com/therundown/api/therundown](https://rapidapi.com/therundown/api/therundown)
- **Preço:** 500 requests/mês GRÁTIS
- **Dados:** NBA, playoffs, temporada regular
- **Canais:** ESPN, NBA League Pass

```bash
# Configurar no Railway:
NBA_API_KEY=sua_chave_aqui
```

### 4️⃣ **Estaduais - GloboEsporte API**
- **Site:** [globoesporte.globo.com](https://globoesporte.globo.com)
- **Método:** Web scraping (sem API oficial)
- **Dados:** Paulistão, Carioca, Mineiro, Gaúcho
- **Canais:** Record, Premiere, YouTube

## 🛠️ **Como Configurar**

### 1️⃣ **Criar Contas nas APIs**
```bash
# 1. Acesse rapidapi.com
# 2. Crie conta gratuita
# 3. Subscribe nas APIs gratuitas
# 4. Copie as API Keys
```

### 2️⃣ **Configurar no Railway**
```bash
# No Railway Dashboard:
# 1. Vá em Variables
# 2. Adicione cada API_KEY
# 3. Deploy automaticamente
```

### 3️⃣ **Testar Localmente**
```bash
# Criar arquivo .env:
DISCORD_TOKEN=seu_token
FOOTBALL_API_KEY=sua_chave_football
UEFA_API_KEY=sua_chave_uefa
NBA_API_KEY=sua_chave_nba

# Testar:
npm start
!shoje  # Deve mostrar dados reais + canais TV
```

## 📺 **Canais de TV Incluídos**

### 🇧🇷 **Brasil:**
- **Brasileirão:** Globo, SporTV, Premiere
- **Libertadores:** SBT, ESPN, Paramount+
- **Copa do Brasil:** Globo, SporTV, Globoplay
- **Estaduais:** Record, Premiere, YouTube

### 🌍 **Internacional:**
- **Champions:** SBT, TNT Sports, HBO Max
- **Premier League:** ESPN, Star+
- **La Liga:** ESPN, Star+
- **NBA:** ESPN, NBA League Pass, Star+

### 📱 **Streaming:**
- **Globoplay, Premiere, Star+**
- **HBO Max, Paramount+, YouTube**
- **NBA League Pass, ESPN App**

## 🎯 **Exemplo de Resposta**

### Comando: `!shoje`
```
⚽ JOGOS DE HOJE

🇧🇷 BRASILEIRÃO SÉRIE A
16:00 - Flamengo vs Palmeiras
📺 Globo, SporTV | 📱 Globoplay, Premiere

18:30 - Corinthians vs São Paulo
📺 Premiere | 📱 Globoplay, Premiere

🏆 UEFA CHAMPIONS LEAGUE
16:00 - Real Madrid vs Liverpool
📺 SBT, TNT Sports | 📱 HBO Max, Paramount+

🏀 NBA
21:30 - Lakers vs Warriors
📺 ESPN, NBA League Pass | 📱 Star+, NBA App
```

## 🔄 **Sistema de Fallback**

### ✅ **Se APIs funcionarem:**
- **Dados reais** de jogos oficiais
- **Horários corretos** de transmissão
- **Canais de TV** e streaming exatos

### ⚠️ **Se APIs falharem:**
- **Automaticamente** usa dados de demonstração
- **Não quebra** o funcionamento do bot
- **Log detalhado** para debug

## 🚀 **Implementação Atual**

### ✅ **JÁ IMPLEMENTADO:**
- ✅ Estrutura completa para APIs reais
- ✅ Mapeamento de canais de TV brasileiros
- ✅ Sistema de fallback automático
- ✅ Suporte a múltiplos campeonatos
- ✅ Informações de streaming

### 🔄 **PARA ATIVAR:**
1. **Configure** as API_KEYs no Railway
2. **Deploy** automático será feito
3. **Teste** com `!shoje` no Discord
4. **Aproveite** dados reais + canais de TV!

## 📈 **Vantagens das APIs Reais**

### 🎯 **Precisão Total:**
- **Horários exatos** dos jogos
- **Times corretos** confirmados
- **Canais oficiais** de transmissão

### 📱 **Informação Completa:**
- **TV aberta:** Globo, SBT, Record
- **TV fechada:** SporTV, ESPN, TNT
- **Streaming:** Star+, Globoplay, Paramount+

### ⚡ **Atualizações Automáticas:**
- **Jogos adiados** automaticamente removidos
- **Novos jogos** incluídos na programação
- **Mudanças de canal** refletidas em tempo real

---

🤖 **Smart Stream Bot** - Agora com dados reais e canais de TV! 📺✨ 