# 🌐 Guia de Deployment - StockVision

## 📚 Índice

- [Render (Recomendado)](#render-recomendado)
- [Heroku](#heroku)
- [Railway](#railway)
- [Azure](#azure)
- [Docker](#docker)
- [Variáveis de Produção](#variáveis-de-produção)

---

## 🎯 Render (Recomendado)

Render é a alternativa moderna ao Heroku com deploy simplificado.

### Pré-requisitos

1. Repositório GitHub público
2. Conta no [Render](https://render.com) (gratuita)
3. MongoDB Atlas account (gratuita)

### Passo 1: Preparar Repositório

**1.1 Adicione `Procfile` na raiz do projeto:**

```
web: node src/backend/server.js
```

**1.2 Verifique `package.json` (engines):**

```json
{
  "name": "stockvision-backend",
  "version": "1.0.0",
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  },
  "scripts": {
    "start": "node src/backend/server.js",
    "dev": "nodemon src/backend/server.js"
  }
}
```

**1.3 Verifique `.gitignore`:**

```
node_modules/
.env
.env.local
npm-debug.log*
yarn-debug.log*
.DS_Store
```

**1.4 Commit e push:**

```bash
git add .
git commit -m "Preparar para deploy no Render"
git push origin main
```

### Passo 2: Deploy no Render

1. Acesse [https://render.com](https://render.com)
2. Clique "New +" e selecione "Web Service"
3. Conecte seu repositório GitHub
4. Selecione o repositório StockVision
5. Configure:
   - **Name**: `stockvision-api`
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/backend/server.js`
   - **Plan**: Free

### Passo 3: Adicionar Variáveis de Ambiente

1. Vá em "Environment" (no Render)
2. Adicione as variáveis:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/stockvision
JWT_SECRET=gerar_valor_aleatorio_seguro
PORT=10000
```

3. Clique "Deploy"

### Monitorar Deploy

```
Deployment Status: ✓ Live
URL: https://stockvision-api.onrender.com
```

---

## 🔴 Heroku (Alternativa)

Heroku ainda é viável mas recomenda-se Render.

### Pré-requisitos

1. Conta no [Heroku](https://www.heroku.com)
2. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) instalado
3. Git configurado

### Passo 1: Login no Heroku

```bash
heroku login
```

Será aberta uma janela do navegador para autenticação.

### Passo 2: Criar App

```bash
heroku create stockvision-api
```

### Passo 3: Configurar MongoDB

```bash
# Adicionar add-on MongoDB
heroku addons:create mongolab:sandbox --app=stockvision-api
```

Heroku vai gerar `MONGODB_URI` automaticamente.

### Passo 4: Adicionar Variáveis

```bash
heroku config:set NODE_ENV=production --app=stockvision-api
heroku config:set JWT_SECRET=gerar_valor_aleatorio_seguro --app=stockvision-api
```

### Passo 5: Deploy

```bash
git push heroku main
```

### Monitorar

```bash
heroku logs --tail --app=stockvision-api
```

---

## 🚂 Railway

Railway oferece free tier generoso.

### Passo 1: Preparar Repo

Mesmo que Render (ver acima).

### Passo 2: Deploy

1. Acesse [Railway.app](https://railway.app)
2. Clique "Start New Project"
3. Selecione "Deploy from GitHub"
4. Autorize e selecione repositório
5. Railway detectará Node.js automaticamente
6. Clique "Deploy"

### Passo 3: Adicionar MongoDB

1. No painel Railway, clique "Add"
2. Selecione "MongoDB"
3. Railway criará connection string automaticamente

### Passo 4: Variáveis de Ambiente

1. Vá para "Variables"
2. Adicione:

```
NODE_ENV=production
JWT_SECRET=seu_secret_seguro
```

---

## ☁️ Azure App Service

Para quem usa Microsoft Azure.

### Pré-requisitos

- Azure Subscription (conta gratuita disponível)
- Azure CLI instalado

### Passo 1: Criar App Service

```bash
# Login
az login

# Criar resource group
az group create --name stockvision-rg --location eastus

# Criar App Service Plan
az appservice plan create \
  --name stockvision-plan \
  --resource-group stockvision-rg \
  --sku F1 --is-linux

# Criar Web App
az webapp create \
  --resource-group stockvision-rg \
  --plan stockvision-plan \
  --name stockvision-api \
  --runtime "NODE:18-lts"
```

### Passo 2: Deploy via Git

```bash
# Configure Git deployment
az webapp up --name stockvision-api --resource-group stockvision-rg

# Deploy via Git
git remote add azure https://stockvision-api.scm.azurewebsites.net/stockvision-api.git
git push azure main
```

### Passo 3: Configurar Variáveis

```bash
az webapp config appsettings set \
  --resource-group stockvision-rg \
  --name stockvision-api \
  --settings NODE_ENV=production JWT_SECRET=seu_secret
```

---

## 🐳 Docker

Para deployment via containerização.

### Passo 1: Criar Dockerfile

Crie `Dockerfile` na raiz:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM node:18-alpine
WORKDIR /app

# Criar usuário non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copiar arquivos
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs src ./src
COPY --from=builder /app/node_modules ./node_modules

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "src/backend/server.js"]
```

### Passo 2: Criar .dockerignore

```
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
```

### Passo 3: Build Image

```bash
docker build -t stockvision:latest .
```

### Passo 4: Testar Localmente

```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/stockvision \
  -e JWT_SECRET=seu_secret \
  stockvision:latest
```

### Passo 5: Push para Registry

#### Docker Hub

```bash
# Login
docker login

# Tag image
docker tag stockvision:latest seu-usuario/stockvision:1.0.0

# Push
docker push seu-usuario/stockvision:1.0.0
```

#### Google Container Registry

```bash
# Configure gcloud
gcloud auth configure-docker

# Tag
docker tag stockvision:latest gcr.io/seu-projeto/stockvision:latest

# Push
docker push gcr.io/seu-projeto/stockvision:latest
```

---

## 📦 Variáveis de Produção

### .env Produção (Seguro)

```env
# ===== SERVIDOR =====
PORT=3000
NODE_ENV=production

# ===== DATABASE =====
MONGODB_URI=mongodb+srv://stockvision_user:SenhaForte123@cluster.mongodb.net/stockvision

# ===== JWT =====
JWT_SECRET=valor_super_secreto_e_aleatorio_com_64_caracteres_minimo
JWT_EXPIRATION=24h

# ===== CORS =====
CORS_ORIGIN=https://seu-dominio.com

# ===== LOGGING =====
LOG_LEVEL=info
```

### Boas Práticas de Segurança

✅ **Use HTTPS** em produção
✅ **Secrets rotacionados** a cada 90 dias
✅ **Rate limiting** implementado
✅ **Logs auditados** regularmente
✅ **Backups automáticos** do banco de dados
✅ **Monitoramento ativo** de performance

---

## 🔄 CI/CD com GitHub Actions

### Passo 1: Criar `.github/workflows/deploy.yml`

```yaml
name: Deploy to Render

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Trigger Render deployment
        run: |
          curl -X POST https://api.render.com/deploy/srv-${{ secrets.RENDER_SERVICE_ID }}?key=${{ secrets.RENDER_API_KEY }}

      - name: Slack notification
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Deploy StockVision: ${{ job.status }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Passo 2: Adicionar Secrets

1. GitHub > Seu Repositório > Settings > Secrets
2. Adicione:
   - `RENDER_SERVICE_ID`
   - `RENDER_API_KEY`
   - `SLACK_WEBHOOK_URL`

---

## 📊 Monitoramento em Produção

### Logs

```bash
# Render
tail -f logs

# Heroku
heroku logs --tail --app=stockvision-api

# Azure
az webapp log tail --name stockvision-api --resource-group stockvision-rg
```

### Performance

```bash
# Verificar CPU/Memória
# Vá no dashboard do seu provider

# Configurar alerts
# Settings > Monitoring > Add Alert
```

### Backup de Database

```bash
# MongoDB Atlas
Settings > Backup > Automated Backups (habilitado por padrão)

# Manual backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/stockvision" --out=./backup
```

---

## 🔗 Checklist de Deploy

- [ ] `.env` produção configurado
- [ ] `Procfile` ou equivalente criado
- [ ] Variáveis de ambiente definidas
- [ ] MongoDB Atlas configurado
- [ ] CORS corrigido para domínio de produção
- [ ] HTTPS habilitado
- [ ] Logs configurados
- [ ] Backups automáticos ativados
- [ ] Monitoramento ativo
- [ ] Domain/DNS configurado
- [ ] SSL certificado instalado

---

## 🚨 Troubleshooting Deploy

### Erro: "Cannot connect to MongoDB"

```bash
# Verificar IP permitido no Atlas
# Ir em: Network Access > Add IP Address

# Usar IP correta da plataforma (Render, Heroku, etc.)
```

### Erro: "Build failed"

```bash
# Verificar logs
# Certificar que package.json está correto
# Certificar que todas dependências estão instaladas
```

### Erro: "Application crashed"

```bash
# Verificar variáveis de ambiente
# Verificar conexão com BD
# Verificar logs de erro
```

---

## 🎯 URLs de Produção

Após deploy:

- **Render**: `https://stockvision-api.onrender.com`
- **Heroku**: `https://stockvision-api.herokuapp.com`
- **Railway**: `https://seu-app.railway.app`
- **Azure**: `https://stockvision-api.azurewebsites.net`

---

## 📞 Suporte Deployment

- 📧 Email: devops@stockvision.com
- 📚 Documentação: https://stockvision-deploy.com

