FROM node:22-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci

# Copiar código
COPY . .

# Expor porta
EXPOSE 4000

# Comando de start
CMD ["npx", "ts-node", "server/src/server.ts"]
