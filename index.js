const http = require('http');

console.log('🚀 Iniciando servidor de teste Railway...');

// Configurações básicas
const PORT = process.env.PORT || 3000;

// Criar servidor HTTP para healthcheck
const server = http.createServer((req, res) => {
    console.log(`📨 Request recebido: ${req.method} ${req.url}`);
    
    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        const response = { 
            status: 'healthy', 
            service: 'railway-test',
            timestamp: new Date().toISOString(),
            port: PORT,
            env: process.env.NODE_ENV || 'development'
        };
        console.log('✅ Healthcheck OK:', response);
        res.end(JSON.stringify(response));
    } else if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Discord Bot Railway Test</h1><p>Server is running!</p>');
    } else {
        console.log('❌ Route not found:', req.url);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor HTTP rodando na porta ${PORT}`);
    console.log(`🔍 Healthcheck disponível em: http://0.0.0.0:${PORT}/health`);
    console.log(`🌍 Status: http://0.0.0.0:${PORT}/`);
});

// Tratamento de erros
server.on('error', (error) => {
    console.error('❌ Erro no servidor:', error);
});

// Tratamento de erros globais
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

console.log('🎯 Servidor inicializado com sucesso!'); 