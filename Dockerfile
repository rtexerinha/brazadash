# Estágio de Build
FROM node:22-slim AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (necessário para o build)
RUN npm install

# Copiar o restante do código (incluindo tsconfig para resolução de aliases)
COPY . .

# Build do projeto (Gera dist/index.cjs e dist/public)
RUN npm run build

# Estágio de Produção
FROM node:22-slim

WORKDIR /app

# Copiar apenas o necessário para rodar o bundle
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server ./server
COPY --from=builder /app/tsconfig.json ./

# Expor a porta
EXPOSE 5000

# Ambiente de produção
ENV NODE_ENV=production

# Usar o comando de produção oficial definido no package.json
CMD ["node", "dist/index.js"]
