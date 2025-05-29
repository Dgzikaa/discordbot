# Usar imagem base com Python e Node.js
FROM python:3.11-slim

# Instalar Node.js
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Criar diretório da aplicação
WORKDIR /app

# Copiar requirements.txt e instalar dependências Python
COPY cs2-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar package.json e instalar dependências Node.js
COPY package*.json ./
RUN npm install

# Copiar código fonte
COPY . .

# Expor portas
EXPOSE 5000 3000

# Script de inicialização
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Comando para iniciar os serviços
CMD ["/start.sh"] 