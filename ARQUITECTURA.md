# 🏗️ Arquitetura Detalhada - StockVision

## 1. Visão Geral da Arquitetura

O StockVision segue uma arquitetura **Cliente-Servidor** com separação clara entre frontend e backend.

```
┌─────────────────┐
│   FRONTEND      │
│  (Navegador)    │
├─────────────────┤
│  HTML/CSS/JS    │
│  Fetch API      │
│  LocalStorage   │
└────────┬────────┘
         │ HTTP/HTTPS
         │ JSON
         │
┌────────▼────────┐
│   BACKEND API   │
│   (Express)     │
├─────────────────┤
│  Controllers    │
│  Middlewares    │
│  Models         │
│  Routes         │
└────────┬────────┘
         │ Driver MongoDB
         │
┌────────▼────────┐
│   DATABASE      │
│   (MongoDB)     │
├─────────────────┤
│  Collections    │
│  Indexes        │
│  Validação      │
└─────────────────┘
```

---

## 2. Arquitetura em Camadas (Layered Architecture)

O projeto segue o padrão MVC adaptado:

### 2.1 Camada de Apresentação (Frontend)

**Responsabilidades:**
- Renderizar interface para o usuário
- Capturar eventos do usuário
- Validação de dados no cliente
- Gerenciamento de temas (light/dark)
- Persistência local (localStorage)

**Estrutura:**
```
frontend/
├── index.html              # SPA principal
├── assets/
│   ├── css/
│   │   ├── global.css      # Estilos globais
│   │   ├── dashboard.css   # Dashboard
│   │   ├── stock.css       # Módulo de estoque
│   │   └── auth.css        # Autenticação
│   └── js/
│       ├── main.js         # Router e app principal
│       ├── api.js          # Camada de API
│       └── theme.js        # Gerenciamento de temas
└── views/
    ├── login.html
    ├── register.html
    ├── dashboard.html
    ├── stock.html
    ├── demand.html
    ├── esg.html
    ├── reverse.html
    └── partners.html
```

**Fluxo de Dados Frontend:**
```
User Interaction → Event Handler → API Call → Response Handler → Update DOM
```

### 2.2 Camada de Roteamento (Routes)

**Responsabilidades:**
- Mapear URLs para controllers
- Aplicar middlewares de autenticação
- Validar permissões de acesso

**Rotas Principais:**
```javascript
/api/auth        → Autenticação (Login/Registro)
/api/stock       → Gestão de Estoque
/api/demand      → Previsão de Demanda
/api/esg         → Métricas ESG
/api/reverse     → Logística Reversa
/api/supply      → Gestão de Suprimentos
/api/partners    → Gestão de Parceiros
```

### 2.3 Camada de Controladores (Controllers)

**Responsabilidades:**
- Processar requisições HTTP
- Validar dados de entrada
- Orquestrar lógica de negócio
- Formatar respostas
- Tratamento de erros

**Padrão de Controller:**
```javascript
exports.functionName = async (req, res) => {
    try {
        // 1. Validar entrada
        // 2. Processar lógica
        // 3. Persistir dados
        // 4. Retornar resposta
    } catch (error) {
        // Tratamento de erro
    }
};
```

### 2.4 Camada de Negócio (Models/Schemas)

**Responsabilidades:**
- Definir estrutura de dados
- Validar dados antes de persistir
- Implementar regras de negócio
- Relacionamentos entre entidades

**Validações Implementadas:**

| Model | Validações |
|-------|-----------|
| **User** | Email único, senha mín 6 caracteres, validar formato email |
| **Product** | Estoque mín < máx, preço > 0, SKU obrigatório |
| **Partner** | CNPJ válido, email válido, nome obrigatório |
| **ReverseLogistics** | Quantidade > 0, motivo obrigatório |

### 2.5 Camada de Persistência (Database)

**Responsabilidades:**
- Armazenar dados
- Gerenciar índices
- Otimizar consultas
- Backup e recuperação

**Coleções MongoDB:**
```
stockvision/
├── users
├── products
├── partners
└── reverselogistics
```

---

## 3. Padrões de Design

### 3.1 MVC (Model-View-Controller)

```
REQUEST
  ↓
ROUTER
  ↓
MIDDLEWARE (Autenticação)
  ↓
CONTROLLER
  ├─ Validação
  ├─ Lógica de Negócio
  └─ Interação com Model
      ↓
    MODEL (MongoDB)
      ↓
RESPONSE (JSON)
```

### 3.2 JWT (JSON Web Tokens)

**Fluxo de Autenticação:**

```
1. Cliente envia credenciais
        ↓
2. Backend valida credenciais
        ↓
3. Backend gera JWT com:
   - ID do usuário
   - Data de expiração (24h)
   - Secret (variável ambiente)
        ↓
4. Cliente armazena JWT (localStorage)
        ↓
5. Cada requisição envia: Authorization: Bearer <JWT>
        ↓
6. Middleware verifica JWT
   - Valida assinatura
   - Verifica expiração
   - Extrai ID do usuário
        ↓
7. Request prossegue com user_id disponível
```

**Payload do JWT:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### 3.3 Middleware Pattern

```javascript
app.use(cors());                    // CORS global
app.use(express.json());            // Parse JSON
app.use(authMiddleware);            // Autenticação
app.use(errorHandler);              // Tratamento de erro
```

**Middleware de Autenticação:**
```javascript
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Token não fornecido' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};
```

### 3.4 Repository Pattern

Abstração de acesso a dados:

```javascript
// Controllers não acessam BD diretamente
// Controllers usam Models/Repository

const user = await User.findById(userId);
const products = await Product.find({ company: company });
const updated = await Product.findByIdAndUpdate(id, data);
```

---

## 4. Fluxo de Dados

### 4.1 Fluxo de Registro de Novo Usuário

```
┌─────────────┐
│ Frontend    │
│ Register.js │
└──────┬──────┘
       │ POST /api/auth/register
       │ { fullname, email, company, password }
       │
┌──────▼──────────────────┐
│ authController.register │
└──────┬──────────────────┘
       │ 1. Validar entrada
       │ 2. Verificar email duplicado
       │ 3. Verificar se é primeira empresa (admin)
       │
┌──────▼──────────────┐
│ User.create()       │
│ Pre-save hook:      │
│ - Hash password     │
│ - Validações        │
└──────┬──────────────┘
       │
┌──────▼──────────┐
│ MongoDB Insert  │
└──────┬──────────┘
       │
┌──────▼────────────────────┐
│ Gerar JWT                 │
│ Retornar token + dados    │
└──────┬────────────────────┘
       │ Response 201 Created
       │ { token, user }
       │
┌──────▼─────────┐
│ Frontend       │
│ Armazenar JWT  │
│ localStorage   │
└────────────────┘
```

### 4.2 Fluxo de Listagem de Produtos

```
┌──────────────┐
│ Frontend     │
│ stock.html   │
└──────┬───────┘
       │ GET /api/stock
       │ Header: Authorization: Bearer <JWT>
       │
┌──────▼────────────────────────┐
│ authMiddleware                 │
│ - Validar JWT                  │
│ - Extrair userId               │
│ - Prosseguir se válido         │
└──────┬────────────────────────┘
       │
┌──────▼─────────────────────┐
│ stockController.getAll()   │
│ 1. Obter company do user   │
│ 2. Filtrar produtos        │
└──────┬─────────────────────┘
       │
┌──────▼────────────────────────┐
│ Product.find({company})        │
│ Query MongoDB                  │
│ Aplicar filtros e paginação    │
└──────┬────────────────────────┘
       │
┌──────▼──────────────────┐
│ Processar resultados    │
│ - Formatar dados        │
│ - Validar permissões    │
│ - Compilar resposta     │
└──────┬──────────────────┘
       │ Response 200 OK
       │ { products: [...], total, page }
       │
┌──────▼──────────────┐
│ Frontend            │
│ Renderizar tabela   │
│ Atualizar DOM       │
└─────────────────────┘
```

### 4.3 Fluxo de Previsão de Demanda (IA)

```
┌──────────────────┐
│ Produto          │
│ salesHistory:    │
│ [100, 150, 120]  │
└──────┬───────────┘
       │
┌──────▼─────────────────────────────────┐
│ demandController.forecast()             │
│                                         │
│ 1. Média Móvel = (100+150+120)/3 = 123 │
│ 2. Tendência = Última > Média? ↑       │
│ 3. Sazonalidade = Padrão semanal?     │
└──────┬─────────────────────────────────┘
       │
┌──────▼────────────────────────────┐
│ Calcular Lead Time                │
│ Dias para chegada = 7 dias        │
└──────┬───────────────────────────┘
       │
┌──────▼──────────────────────────────┐
│ Quantidade Recomendada:             │
│ Média Móvel × Lead Time Days × Seg. │
│ 123 × 7 ÷ 3 = 286 unidades         │
└──────┬───────────────────────────────┘
       │ Response 200 OK
       │ { prediction, recommendation, confidence }
       │
┌──────▼─────────────────┐
│ Frontend               │
│ Exibir recomendação   │
│ Botão para aceitar    │
└───────────────────────┘
```

---

## 5. Segurança

### 5.1 Camadas de Segurança

```
┌─────────────────────────────────────┐
│ 1. CORS (Cross-Origin)              │
│    Apenas domínios autorizados      │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 2. HTTPS/TLS (Produção)             │
│    Criptografia em trânsito         │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 3. JWT (Autenticação)               │
│    Token com assinatura verificada  │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 4. Validação de Entrada             │
│    Rejeitar dados inválidos         │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 5. Criptografia bcrypt              │
│    Senhas com salt aleatório        │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 6. Isolamento de Dados              │
│    Dados por empresa (multi-tenant) │
└─────────────────────────────────────┘
```

### 5.2 Ciclo de Vida da Senha

```
1. Usuário digita: "MinhaSenh@123"
         ↓
2. Validação cliente
   - Mínimo 6 caracteres? ✓
   - Contém número? ✓
         ↓
3. Envio (HTTPS)
   - Criptografia TLS
   - Não armazenar em localStorage
         ↓
4. Recebimento Backend
   - Hash com bcrypt (10 rounds)
   - Salt aleatório
         ↓
5. Armazenamento
   - $2b$10$hash_super_seguro_aqui
         ↓
6. Login Posterior
   - Usuário: "MinhaSenh@123"
   - bcrypt.compare() ↔ hash armazenado
   - Match? → JWT gerado ✓
```

---

## 6. Performance e Escalabilidade

### 6.1 Índices MongoDB

```javascript
// Índices recomendados para performance

// Users
db.users.createIndex({ email: 1 });           // Busca por email
db.users.createIndex({ company: 1 });         // Busca por empresa

// Products
db.products.createIndex({ company: 1 });      // Filtro por empresa
db.products.createIndex({ sku: 1 });          // Busca SKU
db.products.createIndex({ category: 1 });     // Filtro categoria
db.products.createIndex({ quantityInStock: 1 });// Produtos com baixo estoque

// Partners
db.partners.createIndex({ company: 1 });
db.partners.createIndex({ cnpj: 1 });

// ReverseLogistics
db.reverselogistics.createIndex({ company: 1 });
db.reverselogistics.createIndex({ status: 1 });
```

### 6.2 Paginação

```javascript
// Frontend
const page = 1;
const limit = 10;

// API Call
GET /api/stock?page=1&limit=10&sort=-createdAt

// Backend
const skip = (page - 1) * limit;
const products = await Product
    .find({ company })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
```

### 6.3 Caching

```javascript
// localStorage para dados frequentes
localStorage.setItem('user', JSON.stringify(userData));
localStorage.setItem('company', companyName);

// Expiração após 24h do JWT
// Refresh automático em nova sessão
```

---

## 7. Monitoramento e Logs

### 7.1 Eventos Importantes a Registrar

```javascript
console.log(`[Auth] Novo usuário registrado: ${email}`);
console.log(`[Stock] Produto criado: ${productId}`);
console.error(`[Database] Erro ao conectar: ${error}`);
console.warn(`[Demand] Baixa precisão na previsão para ${productId}`);
```

### 7.2 Métricas Recomendadas

- ✅ Tempo de resposta por rota
- ✅ Taxa de erro (4xx, 5xx)
- ✅ Queries lentas no BD
- ✅ Autenticações falhadas
- ✅ Acesso não autorizado

---

## 8. Roadmap de Melhorias

### Curto Prazo (v1.1)
- ✅ Testes unitários com Jest
- ✅ Validação de entrada com Joi
- ✅ Rate limiting com express-rate-limit
- ✅ Logs estruturados com Winston

### Médio Prazo (v1.2)
- 🔄 API GraphQL
- 🔄 WebSockets para notificações real-time
- 🔄 Busca Elasticsearch
- 🔄 Sistema de permissões granulares (RBAC)

### Longo Prazo (v2.0)
- 📅 Machine Learning avançado
- 📅 Integração IoT (sensores de estoque)
- 📅 AR para localização de produtos
- 📅 Mobile app nativa

---

## 9. Diagrama de Relacionamentos

```
┌──────────────┐         ┌──────────────┐
│    USER      │         │   COMPANY    │
├──────────────┤         ├──────────────┤
│ _id          │         │ name         │
│ email        │───┐     │ sector       │
│ company      │   └─────│ founded      │
│ password     │         │ status       │
│ isAdmin      │         └──────────────┘
│ isActive     │
└──────────────┘

        ▼ (1:N)

┌──────────────────┐     ┌────────────────┐
│    PRODUCT       │     │    PARTNER     │
├──────────────────┤     ├────────────────┤
│ _id              │     │ _id            │
│ company (FK)     │─────│ company (FK)   │
│ sku              │     │ partnerName    │
│ name             │     │ partnerType    │
│ category         │     │ cnpj           │
│ quantityInStock  │     │ contactEmail   │
│ location         │     └────────────────┘
│ salesHistory     │
└──────────────────┘

        ▼ (1:N)

┌──────────────────────┐
│ REVERSELOGISTICS     │
├──────────────────────┤
│ _id                  │
│ company (FK)         │
│ product (FK)         │
│ quantity             │
│ reason               │
│ destination          │
│ status               │
│ carbonFootprint      │
└──────────────────────┘
```

---

## 10. Conclusão

O StockVision foi projetado com:

- ✅ **Escalabilidade** - Estrutura modular permite crescimento
- ✅ **Segurança** - Múltiplas camadas de proteção
- ✅ **Performance** - Índices e paginação otimizados
- ✅ **Manutenibilidade** - Código limpo e bem documentado
- ✅ **Confiabilidade** - Tratamento robusto de erros

**Próximos passos:** Implementar testes, adicionar observabilidade, considerar escalabilidade horizontal.

