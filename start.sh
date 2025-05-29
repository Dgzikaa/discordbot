#!/bin/sh

# Configurar variáveis de ambiente
export NODE_ENV=production
export PORT=3000

echo "=== RAILWAY DEBUG START ==="
echo "PWD: $(pwd)"
echo "PORT: $PORT"
echo "NODE_ENV: $NODE_ENV"
echo "Files in /app:"
ls -la /app/
echo "=== Starting Discord Bot with HTTP server on port $PORT ==="

# Executar apenas o Node.js por enquanto para testar healthcheck
cd /app && node index.js
