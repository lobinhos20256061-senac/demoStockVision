# ❓ FAQ e Troubleshooting - StockVision

## 📚 Índice

- [Perguntas Frequentes](#perguntas-frequentes)
- [Erros Comuns](#erros-comuns)
- [Performance](#performance)
- [Segurança](#segurança)

---

## ❓ Perguntas Frequentes

### 1. Como resetar a senha?

**Atualmente:** Não há sistema de "esqueci a senha".

**Solução temporária:**
1. Entrar no MongoDB diretamente
2. Deletar o usuário: `db.users.deleteOne({ email: 'seu-email@example.com' })`
3. Registrar nova conta

**Para produção:** Implementar endpoint de reset com email

---

### 2. Posso usar a mesma conta em múltiplas empresas?

**Não.** Cada usuário está vinculado a UMA empresa.

**Se precisar múltiplas empresas:**
1. Crie contas diferentes para cada empresa
2. Use emails alternativos (nome+empresa@example.com)

---

### 3. Como adicionar mais usuários à mesma empresa?

```javascript
// 1º usuário de Empresa XYZ registrado = Admin
// 2º usuário de Empresa XYZ = Usuário normal

// Todos compartilham os dados da empresa
// Segmentação por field `company` no MongoDB
```

---

### 4. Qual é o limite de produtos?

**Atualmente:** Sem limite implementado.

**Recomendado:** Implementar paginação agressiva após 10.000 produtos.

**Configurar:**
```javascript
// Padrão: 10 produtos por página
const PRODUCTS_PER_PAGE = 10;

// Aumentar se necessário
const PRODUCTS_PER_PAGE = 50;
```

---

### 5. Como fazer backup dos dados?

**MongoDB Atlas (Cloud):**
```bash
# Backup manual via Compass
# Ou usar automático (habilitado por padrão)
```

**MongoDB Local:**
```bash
# Fazer dump
mongodump --db stockvision --out ./backup

# Restaurar
mongorestore ./backup
```

---

### 6. Posso integrar com sistemas legados?

**Sim.** Através da API REST.

**Exemplo - Python:**
```python
import requests

BASE_URL = "http://localhost:3000/api"

# Login
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "email": "user@example.com",
        "password": "senha123"
    }
)

token = login_response.json()["token"]

# Requisição autenticada
headers = {"Authorization": f"Bearer {token}"}

products = requests.get(
    f"{BASE_URL}/stock",
    headers=headers
).json()

for product in products["products"]:
    print(f"{product['sku']} - {product['name']}")
```

---

### 7. Como escalar para 1 milhão de produtos?

**Recomendações:**

1. **Índices no MongoDB:**
```javascript
db.products.createIndex({ company: 1, createdAt: -1 });
db.products.createIndex({ sku: 1 });
db.products.createIndex({ quantityInStock: 1 });
```

2. **Paginação:**
```javascript
// Sempre paginar
GET /api/stock?page=1&limit=50
```

3. **Caching:**
```javascript
// Implementar Redis
// Cachear produtos frequentemente acessados
```

4. **Sharding MongoDB:**
```javascript
// Dividir dados por empresa
// Usar shard key: { company: 1 }
```

5. **Separar em Microserviços:**
```
- Auth Service
- Stock Service
- Demand Service
- ESG Service
```

---

### 8. Como adicionar autenticação social (Google/GitHub)?

**Instalar Passport.js:**
```bash
npm install passport passport-google-oauth20 express-session
```

**Configurar:**
```javascript
// config/passport.js

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ email: profile.emails[0].value });
        
        if (!user) {
            user = await User.create({
                fullname: profile.displayName,
                email: profile.emails[0].value,
                company: profile.emails[0].value.split('@')[1],
                password: 'oauth_user_' + profile.id
            });
        }
        
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));
```

---

### 9. Posso exportar dados para Excel?

**Instalar bibliotecas:**
```bash
npm install exceljs
```

**Implementar endpoint:**
```javascript
exports.exportToExcel = async (req, res) => {
    const ExcelJS = require('exceljs');
    const products = await Product.find({ company: req.company });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Produtos');

    worksheet.columns = [
        { header: 'SKU', key: 'sku' },
        { header: 'Nome', key: 'name' },
        { header: 'Quantidade', key: 'quantityInStock' },
        { header: 'Preço', key: 'sellingPrice' }
    ];

    products.forEach(product => {
        worksheet.addRow(product);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=stockvision.xlsx');

    await workbook.xlsx.write(res);
    res.end();
};
```

---

### 10. Como adicionar notificações em tempo real?

**Instalar Socket.io:**
```bash
npm install socket.io
```

**Usar WebSockets:**
```javascript
const io = require('socket.io')(app, {
    cors: { origin: process.env.CORS_ORIGIN }
});

// Quando estoque baixo
Product.watch().on('change', (change) => {
    io.emit('stock-alert', {
        product: change.operationDescription,
        timestamp: new Date()
    });
});
```

---

## ❌ Erros Comuns

### Erro: "Cannot set headers after they are sent to the client"

**Causa:** Múltiplas `res.send()` ou `res.json()` na mesma função.

**Solução:**
```javascript
// ❌ ERRADO
exports.create = async (req, res) => {
    const product = await Product.create(req.body);
    res.json(product);
    res.status(201).json(product);  // ← Erro aqui!
};

// ✅ CORRETO
exports.create = async (req, res) => {
    const product = await Product.create(req.body);
    return res.status(201).json(product);  // ← Return garante saída
};
```

---

### Erro: "JWT malformed"

**Causa:** Token não enviado corretamente no header.

**Solução:**
```javascript
// ❌ ERRADO
Authorization: eyJhbGciOiJIUzI1NiIs...

// ✅ CORRETO
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

### Erro: "MongooseServerSelectionError: connect ECONNREFUSED"

**Causa:** MongoDB não está rodando.

**Solução:**

**Windows:**
```bash
# Iniciar serviço MongoDB
net start MongoDB

# Ou verificar se está instalado
```

**Mac:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Cloud (Atlas):**
```bash
# Verificar connection string
# Verificar IP permitido em Network Access
# Verificar credenciais
```

---

### Erro: "ValidationError: Path `sku` is required"

**Causa:** Campo obrigatório não foi preenchido.

**Solução:**
```javascript
// Antes de criar
if (!req.body.sku) {
    return res.status(400).json({ message: 'SKU é obrigatório' });
}

const product = await Product.create(req.body);
```

---

### Erro: "CastError: Cast to ObjectId failed"

**Causa:** ID do MongoDB em formato inválido.

**Solução:**
```javascript
const mongoose = require('mongoose');

// Validar ID antes de usar
if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID inválido' });
}

const product = await Product.findById(req.params.id);
```

---

### Erro: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Causa:** CORS não configurado.

**Solução:**
```javascript
// server.js
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
```

**Ou mais específico:**
```javascript
app.use(cors({
    origin: ['http://localhost:3000', 'https://seu-dominio.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
```

---

### Erro: "TypeError: Cannot read property 'company' of undefined"

**Causa:** `req.user` não existe (token não foi validado).

**Solução:**
```javascript
// Garantir que middleware de auth está aplicado
router.get('/stock', authMiddleware, stockController.getAll);
//                   ↑ Middleware presente
```

---

## ⚡ Performance

### Consultas Lentas

**Identificar:**
```bash
# MongoDB Compass
# Query > Explain Plan > Check index usage
```

**Otimizar:**
```javascript
// ❌ Sem índice - LENTO
const products = await Product.find({ category: 'Eletrônicos' });

// ✅ Com índice - RÁPIDO
db.products.createIndex({ category: 1 });
```

---

### Reduzir Payload

```javascript
// ❌ LENTO - Todos os campos
GET /api/stock
// Retorna 1MB por requisição

// ✅ RÁPIDO - Campos específicos
GET /api/stock?fields=sku,name,quantity
// Retorna 100KB por requisição

// Implementar:
exports.getAll = async (req, res) => {
    const fields = req.query.fields?.split(',').join(' ');
    
    const products = await Product
        .find({ company: req.company })
        .select(fields || '-salesHistory');  // Excluir campos grandes
};
```

---

### Cache com Redis

```bash
npm install redis
```

```javascript
const redis = require('redis');
const client = redis.createClient();

exports.getAll = async (req, res) => {
    const cacheKey = `products:${req.company}`;
    
    // Tentar cache
    const cached = await client.get(cacheKey);
    if (cached) {
        return res.json(JSON.parse(cached));
    }
    
    // Se não estiver em cache, buscar
    const products = await Product.find({ company: req.company });
    
    // Armazenar em cache por 5 minutos
    await client.setex(cacheKey, 300, JSON.stringify(products));
    
    res.json(products);
};
```

---

### Paginação Eficiente

```javascript
// ❌ INEFICIENTE - Skip é lento em grandes bases
const products = await Product.find().skip(1000000).limit(10);

// ✅ EFICIENTE - Usar cursor/seek
const products = await Product
    .find({ _id: { $gt: lastId } })  // Buscar após último ID
    .limit(10);
```

---

## 🔒 Segurança

### Validar Entrada

```javascript
// Usar biblioteca Joi
const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    fullname: Joi.string().required()
});

const { error, value } = schema.validate(req.body);
if (error) {
    return res.status(400).json({ message: error.details[0].message });
}
```

---

### Escapar Queries

```javascript
// ❌ VULNERÁVEL - SQL Injection (se usasse SQL)
const user = await User.findOne({
    email: req.body.email  // Entrada do usuário diretamente
});

// ✅ SEGURO - Mongoose faz escaping automático
// Mas validar mesmo assim
const user = await User.findOne({
    email: validator.isEmail(req.body.email) ? req.body.email : null
});
```

---

### Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 100,                   // 100 requisições
    message: 'Muitas requisições, tente novamente mais tarde'
});

app.use('/api/auth/login', limiter);
```

---

### Senhas Fortes

```javascript
// Validar ao registrar
function validatePassword(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumbers && password.length >= 8;
}

if (!validatePassword(req.body.password)) {
    return res.status(400).json({
        message: 'Senha deve ter maiúscula, minúscula, número e caractere especial'
    });
}
```

---

### HTTPS em Produção

```bash
# Usar certificado SSL gratuito (Let's Encrypt)
# Render, Heroku e Railway fazem automaticamente

# Ou configurar manualmente:
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('private-key.pem'),
    cert: fs.readFileSync('certificate.pem')
};

https.createServer(options, app).listen(3000);
```

---

### Nunca Commitar Secrets

```bash
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
```

---

## 📞 Precisa de Ajuda?

- 📧 Email: support@stockvision.com
- 💬 Discord: [Link]
- 📚 Docs: https://stockvision-docs.com
- 🐛 Issues: GitHub Issues

---

**Última atualização**: 2026-07-06

