# Usar imagem base Node.js
FROM node:18-slim

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e instalar dependências Node.js
COPY package*.json ./
RUN npm install

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3000

# Comando para iniciar o serviço diretamente
CMD ["node", "test.js"] 