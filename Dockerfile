# Usar imagem base com Python e Node.js
FROM python:3.11-slim

# Instalar Node.js
RUN apt-get update && \
    apt-get install -y curl dos2unix && \
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

# Converter para formato Unix e garantir permissão de execução
RUN dos2unix /app/start.sh && chmod +x /app/start.sh

# Expor portas
EXPOSE 5000 3000

# Comando para iniciar os serviços
CMD ["/app/start.sh"] 