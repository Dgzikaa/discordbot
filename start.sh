#!/bin/bash

# Garantir que Python está no PATH
export PATH="/usr/local/bin:$PATH"

echo "🚀 Iniciando serviços..."

# Iniciar serviço Python em background
echo "🐍 Iniciando serviço Python CS2..."
cd /app/cs2-service
python app.py &
echo "✅ Serviço Python iniciado!"

# Iniciar bot Discord
echo "🤖 Iniciando bot Discord..."
cd /app
node discord-bot.js 