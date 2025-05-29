# 🚂 **Deploy GRATUITO no Railway**

## 💰 **100% GRATUITO** - $5 crédito mensal grátis para sempre!

### ✅ **Por que Railway?**
- 🎁 **$5/mês GRÁTIS** (suficiente para o bot)
- ⚡ **Deploy automático** do GitHub
- 🔄 **Auto-restart** se crashar
- 📊 **Logs em tempo real**
- 🌐 **Domínio gratuito**

---

## 🚀 **Passo a Passo (5 minutos)**

### 1. **Preparar GitHub**
```bash
# Se não tem git configurado
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# Inicializar repositório
git init
git add .
git commit -m "Smart Stream Bot inicial"

# Criar repositório no GitHub e fazer push
git remote add origin https://github.com/SEU_USER/smart-stream-bot.git
git branch -M main
git push -u origin main
```

### 2. **Railway Setup**
1. Acesse [railway.app](https://railway.app)
2. **"Start a New Project"**
3. **"Deploy from GitHub repo"**
4. Conecte sua conta GitHub
5. Selecione o repositório do bot
6. **Deploy** ✅

### 3. **Configurar Variáveis**
No Railway Dashboard:
- **Variables** → Add:
  - `NODE_ENV` = `production`
  - `WEBHOOK_URL` = `sua_webhook_url`

### 4. **Deploy Automático**
- Toda vez que você fizer `git push`, atualiza automaticamente
- Bot roda 24/7 GRÁTIS

---

## 📊 **Recursos Gratuitos Railway:**
- ✅ **500 horas/mês** (mais que suficiente para 24/7)
- ✅ **1GB RAM + 1 CPU**
- ✅ **1GB Storage**
- ✅ **100GB Bandwidth**
- ✅ **Domínio custom grátis** 