# 💻 Guia de Desenvolvimento - StockVision

## 📚 Índice

- [Estrutura de Código](#estrutura-de-código)
- [Convenções](#convenções)
- [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
- [Testes](#testes)
- [Debug](#debug)
- [Contribuindo](#contribuindo)

---

## 🏗️ Estrutura de Código

### Backend - Controllers

**Local**: `src/backend/controllers/`

Cada controller gerencia a lógica de um módulo:

```javascript
// authController.js - Exemplo padrão

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Função auxiliar
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d'
    });
};

/**
 * DESCRIÇÃO DO QUE A FUNÇÃO FAZ
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {JSON} Response JSON
 */
exports.register = async (req, res) => {
    try {
        // 1. Validar entrada
        const { fullname, email, company, password } = req.body;

        // 2. Verificações de negócio
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ 
                message: 'Este e-mail já está em uso no sistema.' 
            });
        }

        // 3. Processar dados
        const newUser = await User.create({
            fullname,
            email,
            company: company.trim(),
            password
        });

        // 4. Preparar resposta
        const token = generateToken(newUser._id);

        // 5. Retornar resposta
        return res.status(201).json({
            message: 'Usuário cadastrado com sucesso!',
            token,
            user: {
                id: newUser._id,
                fullname: newUser.fullname,
                email: newUser.email,
                company: newUser.company,
                isAdmin: newUser.isAdmin
            }
        });

    } catch (error) {
        // 6. Tratamento de erro
        console.error('[AuthController.register] Erro:', error.message);
        return res.status(500).json({
            message: 'Erro ao registrar usuário',
            error: error.message
        });
    }
};
```

### Backend - Models

**Local**: `src/backend/models/`

Definem a estrutura de dados:

```javascript
// Product.js - Exemplo padrão

const mongoose = require('mongoose');

/**
 * Schema para localização do produto no WMS
 * Não cria _id adicional (_id: false)
 */
const LocationSchema = new mongoose.Schema({
    sector: { type: String, trim: true, default: 'Não Alocado' },
    row: { type: String, trim: true, required: true },
    building: { type: String, trim: true },
    floor: { type: String, trim: true },
    apartment: { type: String, trim: true }
}, { _id: false });

/**
 * Schema principal do Produto
 */
const ProductSchema = new mongoose.Schema({
    // Informações básicas
    company: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: 'Geral' },

    // Preços
    sellingPrice: { type: Number, required: true, min: 0 },
    acquisitionCost: { type: Number, required: true, min: 0 },

    // Estoque
    quantityInStock: { type: Number, required: true, min: 0, default: 0 },
    minimumStock: { type: Number, required: true, min: 0 },
    maximumStock: { type: Number, required: true, min: 0 },

    // Outras informações
    supplier: { type: String, trim: true, default: 'Não Definido' },
    location: { type: LocationSchema, required: true },
    leadTimeDays: { type: Number, default: 7, min: 1 },

    // Timestamps
    createdAt: { type: Date, default: Date.now }
});

/**
 * Validação customizada antes de salvar
 * Garante que estoque mínimo < máximo
 */
ProductSchema.pre('save', function(next) {
    if (this.minimumStock > this.maximumStock) {
        return next(new Error(
            'Regra Logística Violada: O estoque mínimo não pode ser maior do que o máximo.'
        ));
    }
    next();
});

module.exports = mongoose.model('Product', ProductSchema);
```

### Frontend - JavaScript

**Local**: `src/frontend/assets/js/`

```javascript
// api.js - Exemplo de client HTTP

/**
 * Classe centralizada para requisições à API
 * Gerencia token JWT automaticamente
 */
class APIClient {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('token');
    }

    /**
     * Fazer requisição HTTP com token
     * @param {string} method - GET, POST, PUT, DELETE
     * @param {string} endpoint - /stock, /auth/login, etc
     * @param {Object} data - Corpo da requisição
     * @returns {Promise<Object>} Resposta da API
     */
    async request(method, endpoint, data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(
                `${this.baseURL}${endpoint}`,
                options
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Métodos convenientes
    get(endpoint) { return this.request('GET', endpoint); }
    post(endpoint, data) { return this.request('POST', endpoint, data); }
    put(endpoint, data) { return this.request('PUT', endpoint, data); }
    delete(endpoint) { return this.request('DELETE', endpoint); }

    // Autenticação
    async login(email, password) {
        const result = await this.post('/auth/login', { email, password });
        this.token = result.token;
        localStorage.setItem('token', result.token);
        return result;
    }
}

const api = new APIClient();
```

---

## 📋 Convenções

### Nomes de Variáveis

```javascript
// ✅ BOM
const userData = { name: 'João', email: 'joao@example.com' };
const isAdmin = true;
const MAX_RETRIES = 3;

// ❌ RUIM
const user_data = { n: 'João', e: 'joao@example.com' };
const admin = true;
const max_retries = 3;
```

### Nomes de Funções

```javascript
// ✅ BOM - Verbo + Substantivo
function getUserById(id) { }
function validateEmail(email) { }
function calculateTotalPrice(items) { }

// ❌ RUIM
function get_user_by_id(id) { }
function validaremail(email) { }
function total(items) { }
```

### Organização de Imports

```javascript
// ✅ BOM - Ordenado
const express = require('express');           // Dependências externas
const jwt = require('jsonwebtoken');
const User = require('../models/User');       // Modelos
const Product = require('../models/Product');
const authMiddleware = require('../middlewares/authMiddleware'); // Middlewares
const config = require('../config/database'); // Config
```

### Tratamento de Erros

```javascript
// ✅ BOM
try {
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(user);
} catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
}

// ❌ RUIM
try {
    const user = await User.findById(userId);
    res.json(user);
} catch (error) {
    res.json({ error: error });
}
```

---

## 🔄 Fluxo de Desenvolvimento

### 1️⃣ Criar Nova Feature

**Passo 1: Criar Branch**
```bash
git checkout -b feature/nova-funcionalidade
```

**Passo 2: Implementar no Backend**

```javascript
// 1. Criar/Atualizar Model (se necessário)
// src/backend/models/NewModel.js

// 2. Criar/Atualizar Controller
// src/backend/controllers/newController.js

// 3. Criar/Atualizar Route
// src/backend/routes/newRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const newController = require('../controllers/newController');

router.get('/', authMiddleware, newController.getAll);
router.post('/', authMiddleware, newController.create);

module.exports = router;

// 4. Registrar rota em server.js
app.use('/api/novo', novoRoutes);
```

**Passo 3: Implementar Frontend**

```html
<!-- src/frontend/views/novo.html -->
<div id="novo-container">
    <h1>Nova Feature</h1>
    <form id="novo-form">
        <input type="text" id="input-name" required>
        <button type="submit">Salvar</button>
    </form>
</div>

<script>
// src/frontend/assets/js/novo.js
document.getElementById('novo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('input-name').value
    };
    
    try {
        const response = await api.post('/novo', data);
        alert('Sucesso!');
    } catch (error) {
        alert('Erro: ' + error.message);
    }
});
</script>
```

**Passo 4: Testar Manualmente**

```bash
npm run dev
# Teste no navegador
```

**Passo 5: Commit**

```bash
git add .
git commit -m "feat: adicionar nova funcionalidade"
git push origin feature/nova-funcionalidade
```

**Passo 6: Pull Request**

- Abrir PR no GitHub
- Descrever mudanças
- Aguardar review

### 2️⃣ Padrão de Commits

```bash
# Feature
git commit -m "feat: adicionar autenticação com 2FA"

# Bug fix
git commit -m "fix: corrigir cálculo de demanda"

# Docs
git commit -m "docs: atualizar README"

# Refactor
git commit -m "refactor: reorganizar controllers"

# Test
git commit -m "test: adicionar testes de autenticação"
```

---

## 🧪 Testes

### Instalando Jest

```bash
npm install --save-dev jest
```

### Configurar Jest

`jest.config.js`:
```javascript
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/index.js'
    ]
};
```

### Exemplo de Teste Unitário

```javascript
// __tests__/auth.test.js

const request = require('supertest');
const app = require('../src/backend/server');

describe('Auth Controller', () => {
    it('deve registrar novo usuário', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                fullname: 'Teste User',
                email: 'teste@example.com',
                company: 'Empresa Teste',
                password: 'senha123'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe('teste@example.com');
    });

    it('não deve registrar com email duplicado', async () => {
        // Primeiro usuário
        await request(app)
            .post('/api/auth/register')
            .send({
                fullname: 'User 1',
                email: 'mesmo@example.com',
                company: 'Empresa 1',
                password: 'senha123'
            });

        // Segundo tentando mesmo email
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                fullname: 'User 2',
                email: 'mesmo@example.com',
                company: 'Empresa 2',
                password: 'senha123'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain('já está em uso');
    });
});
```

### Rodar Testes

```bash
# Todos os testes
npm test

# Teste específico
npm test -- auth.test.js

# Com cobertura
npm test -- --coverage
```

---

## 🐛 Debug

### VS Code Debugger

**1. Criar `.vscode/launch.json`:**

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "StockVision Dev",
            "program": "${workspaceFolder}/src/backend/server.js",
            "restart": true,
            "console": "integratedTerminal",
            "env": {
                "NODE_ENV": "development"
            },
            "preLaunchTask": "npm: dev"
        }
    ]
}
```

**2. Pressionar F5** para iniciar debug

**3. Usar breakpoints:**
- Clique no número da linha
- Ponto vermelho aparece
- Execução pausa naquele ponto

### Console.log Estruturado

```javascript
// ❌ Ruim
console.log(user);

// ✅ Bom
console.log('[UserController.getById]', { userId, user });
console.error('[Error]', { endpoint: '/api/stock', error: error.message });
console.warn('[Warning]', { lowStock: count });
```

### Debugar no Frontend

```javascript
// Browser DevTools (F12)
// Console: 
api.get('/api/stock').then(data => console.log(data));

// Debugar fetch
fetch('/api/stock', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## 🤝 Contribuindo

### Pré-requisitos para Contribuir

1. Fork o repositório
2. Clone seu fork
3. Crie uma branch (`git checkout -b feature/XYZ`)
4. Instale dependências
5. Siga as convenções acima

### Checklist antes de PR

- [ ] Código segue as convenções
- [ ] Sem `console.log` de debug
- [ ] Sem tokens ou secrets no código
- [ ] Teste manualmente funciona
- [ ] Commit message clara
- [ ] Documentação atualizada

### Código Review

- Aguarde feedback
- Faça ajustes conforme pedido
- Responda comentários
- Após aprovação, merge automático

---

## 📚 Referências Úteis

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [JavaScript ES6+](https://javascript.info/)

---

**Happy Coding! 🚀**

