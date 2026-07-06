# 🚀 Guia de Instalação e Configuração - StockVision

## 📋 Pré-requisitos

### Windows/Mac/Linux

Você vai precisar de:

- **Node.js** (v14.0.0 ou superior)
  - [Download Node.js](https://nodejs.org/)
  - Inclui npm automaticamente
  
- **MongoDB** (opções):
  - **Local**: [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
  - **Cloud**: [MongoDB Atlas (Gratuito)](https://www.mongodb.com/cloud/atlas)

- **Git** (opcional, mas recomendado)
  - [Download Git](https://git-scm.com/)

- **Editor de Código** (recomendado)
  - [Visual Studio Code](https://code.visualstudio.com/)

---

## ✅ Verificando Pré-requisitos

### Verificar Node.js

```bash
node --version
npm --version
```

**Saída esperada:**
```
v18.16.0
9.6.7
```

### Verificar Git (se instalado)

```bash
git --version
```

---

## 🔧 Instalação Passo a Passo

### Passo 1: Clone o Repositório

```bash
# Via HTTPS
git clone https://github.com/seu-usuario/stockvision.git
cd StockVision

# Ou download manual
# Extraia o arquivo ZIP na pasta desejada
```

### Passo 2: Instale as Dependências

```bash
npm install
```

**Tempo esperado:** 2-5 minutos (depende da conexão)

**Saída esperada:**
```
added 150 packages, and audited 151 packages in 45s
```

### Passo 3: Configure o MongoDB

#### Opção A: MongoDB Local

**No Windows:**
1. Faça download do MongoDB Community Edition
2. Execute o instalador e siga as instruções
3. MongoDB rodará em `mongodb://localhost:27017`

**No Mac (via Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**No Linux (Ubuntu):**
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

#### Opção B: MongoDB Atlas (Cloud)

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita
3. Crie um novo cluster (opção gratuita disponível)
4. Configure credenciais de acesso
5. Obtenha a string de conexão:
   ```
   mongodb+srv://usuario:senha@cluster.mongodb.net/stockvision
   ```

### Passo 4: Crie o Arquivo .env

Na raiz do projeto, crie um arquivo chamado `.env`:

```bash
# Windows (PowerShell)
New-Item .env

# Mac/Linux
touch .env
```

**Conteúdo do .env (DESENVOLVIMENTO):**

```env
# === SERVIDOR ===
PORT=3000
NODE_ENV=development

# === BANCO DE DADOS ===
# Se usar MongoDB local:
MONGODB_URI=mongodb://localhost:27017/stockvision

# Se usar MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/stockvision

# === AUTENTICAÇÃO ===
JWT_SECRET=sua_chave_super_secreta_aqui_mudar_em_producao

# === LOGGING ===
LOG_LEVEL=debug
```

**⚠️ IMPORTANTE:**
- Nunca commite o arquivo `.env` (adicione a `.gitignore`)
- Mude o `JWT_SECRET` em produção
- Use senhas fortes no MongoDB Atlas

### Passo 5: Teste a Conexão

```bash
npm run dev
```

**Saída esperada:**
```
[Servidor] StockVision operacional e sincronizado na porta 3000
```

Acesse: http://localhost:3000

---

## 🗂️ Estrutura de Pastas Criada

Após instalação, você terá:

```
StockVision/
├── node_modules/          # Dependências instaladas
├── src/
│   ├── backend/
│   │   ├── server.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── middlewares/
│   └── frontend/
├── .env                   # Variáveis de ambiente (NÃO commitar)
├── .gitignore             # Arquivos ignorados no Git
├── package.json
└── README.md
```

---

## 🗄️ Configurar MongoDB

### Criar Banco de Dados no Atlas

1. **Acessar Atlas Dashboard**
   - Faça login em mongodb.com/cloud/atlas

2. **Criar Cluster**
   - Clique em "Create"
   - Selecione opção gratuita M0
   - Escolha região mais próxima
   - Clique "Create Cluster"

3. **Configurar Acesso**
   - Vá em "Database Access"
   - Clique "Add New Database User"
   - Username: `stockvision_user`
   - Password: (gere automático)
   - Salve as credenciais

4. **Permitir Acesso de Rede**
   - Vá em "Network Access"
   - Clique "Add IP Address"
   - Selecione "Allow access from anywhere" (desenvolviment)
   - Clique "Confirm"

5. **Obter Connection String**
   - Clique "Connect"
   - Selecione "Connect your application"
   - Copie a string de conexão
   - Substitua `<username>` e `<password>`
   - Cole no `.env`

**Exemplo:**
```env
MONGODB_URI=mongodb+srv://stockvision_user:Abc123456@cluster.mongodb.net/stockvision
```

---

## 🔒 Gerar JWT_SECRET Seguro

Execute no terminal:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Python
python -c "import secrets; print(secrets.token_hex(32))"

# OpenSSL
openssl rand -hex 32
```

**Saída esperada:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

Cole este valor no `.env`:
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

## 🚀 Executar a Aplicação

### Modo Desenvolvimento (Com Hot-Reload)

```bash
npm run dev
```

**Vantagens:**
- Recarrega automaticamente ao salvar arquivos
- Melhor para desenvolvimento
- Mostra logs detalhados

### Modo Produção

```bash
npm start
```

**Vantagens:**
- Performance otimizada
- Sem reload automático
- Melhor para servidor

---

## 🧪 Testar a Instalação

### 1. Verificar se o servidor está rodando

```bash
curl http://localhost:3000
```

Ou abra no navegador: http://localhost:3000

### 2. Testar Registro de Usuário

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Teste User",
    "email": "teste@exemplo.com",
    "company": "Empresa Teste",
    "password": "senha123"
  }'
```

**Resposta esperada:**
```json
{
  "message": "Usuário cadastrado com sucesso!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### 3. Testar Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "senha123"
  }'
```

---

## ❌ Troubleshooting

### Problema: "Port 3000 already in use"

**Solução 1: Mudar porta no .env**
```env
PORT=3001
```

**Solução 2: Liberar porta (Windows)**
```bash
# Encontrar processo usando porta 3000
netstat -ano | findstr :3000

# Matar processo (substitua PID)
taskkill /PID 12345 /F
```

**Solução 3: Liberar porta (Mac/Linux)**
```bash
# Encontrar processo
lsof -i :3000

# Matar processo
kill -9 <PID>
```

---

### Problema: "Cannot connect to MongoDB"

**Verificar:**
1. MongoDB está rodando?
   ```bash
   # Windows
   services.msc  # procure MongoDB

   # Mac
   brew services list  # procure mongodb-community

   # Linux
   sudo systemctl status mongod
   ```

2. Connection string correta?
   ```env
   MONGODB_URI=mongodb://localhost:27017/stockvision
   ```

3. Credenciais corretas (se usando Atlas)?
   - Verifique username e password
   - Verifique IP permitido

---

### Problema: "npm ERR! code EACCES"

**No Mac/Linux:**
```bash
sudo chown -R $(whoami) ~/.npm
npm install
```

---

### Problema: Node.js não encontrado

**Windows:**
1. Faça download de https://nodejs.org
2. Execute o instalador
3. Reinicie o terminal
4. Verifique: `node --version`

**Mac (Homebrew):**
```bash
brew install node
```

**Linux (Ubuntu):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

### Problema: "Cannot find module"

```bash
# Remova node_modules e reinstale
rm -rf node_modules package-lock.json  # Mac/Linux
rmdir /s node_modules                  # Windows

npm install
```

---

## 📝 Arquivo .env Exemplo Completo

```env
# ===== SERVIDOR =====
PORT=3000
NODE_ENV=development
HOST=localhost

# ===== DATABASE =====
# Desenvolvimento (Local)
MONGODB_URI=mongodb://localhost:27017/stockvision

# Produção (Atlas)
# MONGODB_URI=mongodb+srv://stockvision_user:senha@cluster.mongodb.net/stockvision

# ===== JWT =====
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRATION=1d

# ===== CORS =====
CORS_ORIGIN=http://localhost:3000

# ===== LOGGING =====
LOG_LEVEL=debug

# ===== AMBIENTE =====
ENVIRONMENT=development
```

---

## ✨ Próximas Etapas

Após instalação bem-sucedida:

1. **Explore a interface**: http://localhost:3000
2. **Crie uma conta**: Registre-se como novo usuário
3. **Adicione produtos**: Teste a criação de produtos
4. **Consulte documentação**: Leia [API_REFERENCE.md](API_REFERENCE.md)
5. **Estude a arquitetura**: Leia [ARQUITECTURA.md](ARQUITECTURA.md)

---

## 🆘 Suporte

- 📧 Email: support@stockvision.com
- 💬 Discord: [Link da comunidade]
- 🐛 Issues: GitHub Issues
- 📚 Docs: https://stockvision-docs.com

---

## ✅ Checklist de Instalação

- [ ] Node.js instalado (v14+)
- [ ] MongoDB configurado (local ou Atlas)
- [ ] Repositório clonado
- [ ] `npm install` executado
- [ ] `.env` criado com valores corretos
- [ ] `npm run dev` funcionando
- [ ] Servidor acessível em localhost:3000
- [ ] Teste de registro bem-sucedido
- [ ] Teste de login bem-sucedido

---

**Parabéns! 🎉 StockVision está pronto para desenvolvimento!**

