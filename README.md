# 🧠 **Smart Stream Bot**

> **Bot inteligente que monitora streamers da Twitch e notifica no Discord**

## ✨ **Funcionalidades**

### 🎮 **Monitoramento Inteligente**
- 🇧🇷 **CS2 Brasil**: gaules, fallen, coldzera, taco
- 🌍 **CS2 Internacional**: esl_csgo, blast, hltv_org  
- ⚽ **Futebol**: casimito, loud_coringa
- 📺 **Variety**: cellbit, bauky

### ⚙️ **Configurações Personalizáveis**
- 👥 **Viewers mínimos** configurável
- ⏰ **Cooldown** entre notificações
- 🕐 **Horários ativos** (8h às 23h)
- 📊 **Relatórios diários** automáticos

---

## 🚂 **Deploy GRATUITO no Railway**

### 💰 **100% GRÁTIS** - $5 crédito mensal!

### 🚀 **Deploy em 3 Passos:**

#### **1. Subir para GitHub**
```bash
git init
git add .
git commit -m "Smart Stream Bot"
git remote add origin https://github.com/SEU_USER/smart-stream-bot.git
git push -u origin main
```

#### **2. Deploy no Railway**
1. Acesse [railway.app](https://railway.app)
2. **"Deploy from GitHub repo"**
3. Conecte sua conta GitHub
4. Selecione este repositório
5. **Deploy** ✅

#### **3. Bot Online 24/7!**
- Deploy automático a cada `git push`
- Logs em tempo real
- Auto-restart se crashar

---

## 🎯 **Comandos Locais**

```bash
# Testar bot
npm test

# Ver configuração
npm run config

# Iniciar localmente
npm start

# Ver ajuda
npm run help
```

### ⚙️ **Personalizar Streamers**
```bash
# Adicionar streamer
node smart-start.js add-streamer cs2_br loud_fallen

# Remover streamer  
node smart-start.js remove-streamer cs2_br taco

# Configurar viewers mínimos
node smart-start.js config min_viewers 5000

# Desativar @everyone
node smart-start.js config ping_everyone false
```

---

## 📊 **Recursos Railway Gratuitos**

- ✅ **500 horas/mês** (24/7 tranquilo)
- ✅ **1GB RAM + 1 CPU** 
- ✅ **1GB Storage**
- ✅ **100GB Bandwidth**
- ✅ **Domínio grátis**

---

## 📝 **Configuração**

O bot salva configurações em `bot-config.json`:

```json
{
  "streamers": {
    "cs2_br": ["gaules", "fallen", "coldzera", "taco"],
    "cs2_international": ["esl_csgo", "blast", "hltv_org"],
    "futebol": ["casimito", "loud_coringa"],
    "variety": ["cellbit", "bauky"]
  },
  "notifications": {
    "ping_everyone": true,
    "min_viewers": 1000,
    "cooldown_minutes": 30
  }
}
```

---

## 🎉 **Pronto!**

Seu bot inteligente está monitorando streamers 24/7 **GRÁTIS**! 

**Railway** = Zero configuração + Deploy automático + $0 custo

---

## 📞 **Suporte**

- 🐛 **Bugs**: Verifique os logs no Railway Dashboard
- ⚙️ **Config**: Use `npm run help` para ver comandos
- 🔄 **Updates**: `git push` atualiza automaticamente 