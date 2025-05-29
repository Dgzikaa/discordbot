#!/bin/sh

# Configurar variáveis de ambiente
export CS2_SERVICE_PORT=5000
export NODE_ENV=production
export PORT=3000

echo "Starting CS2 Service on port $CS2_SERVICE_PORT..."
cd /app/cs2-service && python app.py &

echo "Waiting for CS2 service to start..."
sleep 5

echo "Starting Discord Bot with HTTP server on port $PORT..."
cd /app && node index.js
