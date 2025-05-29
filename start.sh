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

echo "=== Starting simple test server ==="
cd /app && node test.js
