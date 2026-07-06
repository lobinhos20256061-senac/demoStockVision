# 📦 StockVision - Sistema Inteligente de Gestão de Estoque e Logística

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Status](https://img.shields.io/badge/status-Ativo-success.svg)

## 🎯 Sobre o Projeto

**StockVision** é um sistema inteligente de gestão de estoque e logística com foco em sustentabilidade (ESG - Environmental, Social, Governance) desenvolvido como projeto integrador do SENAC. A plataforma oferece uma solução completa para gerenciamento de inventário, análise de demanda com inteligência artificial, logística reversa e métricas de sustentabilidade.

### Principais Características

✅ **Gestão de Estoque Inteligente** - Rastreamento em tempo real com endereçamento WMS  
✅ **Motor de Previsão de Demanda** - IA para otimizar quantidades de reposição  
✅ **Logística Reversa** - Economia circular e retorno de produtos  
✅ **Métricas ESG** - Rastreamento de impacto ambiental e social  
✅ **Gestão de Parceiros** - Integração com fornecedores e transportadoras  
✅ **Autenticação Segura** - JWT com criptografia bcrypt  
✅ **Dashboard Responsivo** - Interface moderna e intuitiva  

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico

**Backend:**
- **Node.js + Express** - Framework web rápido e escalável
- **MongoDB** - Banco de dados NoSQL para flexibilidade
- **Mongoose** - ODM para modelagem de dados
- **JWT** - Autenticação stateless
- **bcrypt** - Criptografia de senhas
- **CORS** - Suporte a múltiplas origens

**Frontend:**
- **HTML5** - Estrutura semântica
- **CSS3** - Design responsivo
- **JavaScript Vanilla** - Sem dependências de frameworks
- **Fetch API** - Requisições HTTP

### Estrutura de Pastas

```
StockVision/
├── src/
│   ├── backend/
│   │   ├── server.js                 # Arquivo principal do servidor
│   │   ├── config/
│   │   │   └── database.js          # Configuração MongoDB
│   │   ├── models/                  # Schemas MongoDB
│   │   │   ├── User.js
│   │   │   ├── Product.js
│   │   │   ├── Partner.js
│   │   │   └── ReverseLogistics.js
│   │   ├── controllers/             # Lógica de negócio
│   │   │   ├── authController.js
│   │   │   ├── stockController.js
│   │   │   ├── esgController.js
│   │   │   ├── supplyController.js
│   │   │   ├── demandController.js
│   │   │   └── reverseController.js
│   │   ├── routes/                  # Definição de rotas
│   │   ├── middlewares/             # Autenticação e validação
│   │   └── database.js
│   └── frontend/
│       ├── index.html               # SPA principal
│       ├── assets/
│       │   ├── css/                 # Estilos por módulo
│       │   └── js/                  # Scripts da interface
│       └── views/                   # Componentes HTML
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Pré-requisitos

- **Node.js** >= 14.x
- **npm** ou **yarn**
- **MongoDB** (local ou Atlas)

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/stockvision.git
   cd StockVision
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure variáveis de ambiente**
   
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/stockvision
   JWT_SECRET=sua_chave_secreta_super_segura_aqui
   NODE_ENV=development
   ```

4. **Inicie o servidor**
   ```bash
   # Modo desenvolvimento (com hot-reload)
   npm run dev

   # Modo produção
   npm start
   ```

5. **Acesse a aplicação**
   ```
   http://localhost:3000
   ```

---

## 📚 Documentação Detalhada

### 🔐 Autenticação

O sistema utiliza **JWT (JSON Web Tokens)** para autenticação stateless.

**Endpoints de Autenticação:**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Registrar novo usuário/empresa |
| POST | `/api/auth/login` | Fazer login no sistema |

**Fluxo de Autenticação:**
1. Usuário registra uma nova empresa (primeiro usuário é admin)
2. Senha é criptografada com bcrypt
3. JWT é gerado com validade de 24h
4. Token é incluído no header `Authorization: Bearer <token>` nas próximas requisições

---

### 📦 Gestão de Estoque

O módulo de estoque oferece controle completo do inventário com endereçamento WMS.

**Estrutura do Produto:**
```javascript
{
  sku: "PROD-001",
  name: "Produto Exemplo",
  company: "Empresa XYZ",
  category: "Eletrônicos",
  sellingPrice: 999.99,
  acquisitionCost: 500.00,
  supplier: "Fornecedor A",
  quantityInStock: 100,
  minimumStock: 20,
  maximumStock: 500,
  expirationDate: "2025-12-31",
  location: {
    sector: "A",
    row: "01",
    building: "1",
    floor: "1",
    apartment: "01"
  },
  leadTimeDays: 7,
  salesHistory: [100, 150, 120]
}
```

**Endpoints de Estoque:**

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/stock` | Listar todos os produtos |
| GET | `/api/stock/:id` | Obter detalhes de um produto |
| POST | `/api/stock` | Criar novo produto |
| PUT | `/api/stock/:id` | Atualizar produto |
| DELETE | `/api/stock/:id` | Remover produto |

---

### 🤖 Motor de Previsão de Demanda (IA)

Analisa o histórico de vendas para prever futuras demandas.

**Algoritmo de Previsão:**
- Média Móvel dos últimos 3 meses
- Considera Lead Time do fornecedor
- Recomenda quantidade otimizada de reposição

**Endpoints de Demanda:**

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/demand/:productId` | Prever demanda de um produto |
| GET | `/api/demand/forecast/all` | Gerar previsão para todo inventário |

---

### ♻️ Logística Reversa (Economia Circular)

Gerencia o retorno de produtos, devolução de fornecedores e reciclagem.

**Tipos de Transações Reversas:**
- Devoluções de clientes
- Retorno a fornecedores
- Reciclagem e descarte responsável
- Revenda de itens remanufaturados

**Endpoints de Logística Reversa:**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/reverse/entry` | Registrar entrada de reversa |
| GET | `/api/reverse/history` | Histórico de transações |
| PUT | `/api/reverse/:id` | Atualizar status de reversa |

---

### 🌱 Métricas ESG (Sustentabilidade)

Rastreia o impacto ambiental, social e de governança.

**Indicadores Monitorados:**
- 📊 Emissão de CO2 por movimentação
- 👥 Impacto social em comunidades
- 🏢 Práticas de governança corporativa
- ♻️ Taxa de reciclagem e reutilização

**Endpoints ESG:**

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/esg/metrics` | Obter métricas ESG atuais |
| GET | `/api/esg/report` | Gerar relatório ESG |
| POST | `/api/esg/tracking` | Registrar evento ESG |

---

### 🤝 Gestão de Parceiros

Integração com fornecedores e parceiros logísticos.

**Tipos de Parceiros:**
- Fornecedores
- Transportadoras
- Centros de distribuição
- Prestadores de serviços

**Endpoints de Parceiros:**

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/partners` | Listar parceiros |
| POST | `/api/partners` | Criar novo parceiro |
| PUT | `/api/partners/:id` | Atualizar parceiro |
| DELETE | `/api/partners/:id` | Remover parceiro |

---

### 📦 Gestão de Suprimentos

Controla a cadeia de suprimentos e reposição de estoque.

**Endpoints de Suprimentos:**

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/supply/orders` | Listar pedidos de suprimento |
| POST | `/api/supply/orders` | Criar novo pedido |
| PUT | `/api/supply/orders/:id` | Atualizar status pedido |

---

## 🔒 Segurança

### Medidas Implementadas

✅ **Autenticação JWT** - Tokens com expiração  
✅ **Criptografia bcrypt** - Senhas com salt  
✅ **Validação de Email** - Regex pattern matching  
✅ **CORS Configurado** - Proteção contra requisições não autorizadas  
✅ **Middleware de Autenticação** - Proteção de rotas  

### Boas Práticas

- Nunca envie JWT pela URL (use headers)
- Altere o `JWT_SECRET` em produção
- Use HTTPS em produção
- Implemente rate limiting para prevenir brute force
- Valide todos os inputs do cliente

---

## 📊 Modelos de Dados

### User (Usuário)
```javascript
{
  fullname: String,           // Nome completo
  email: String,              // Único, lowercase
  company: String,            // Empresa do usuário
  password: String,           // Criptografada
  isAdmin: Boolean,           // Primeiro da empresa é admin
  isActive: Boolean,          // Controle de ativação
  createdAt: Date
}
```

### Product (Produto)
```javascript
{
  company: String,            // Empresa proprietária
  sku: String,                // Código SKU
  name: String,               // Nome do produto
  category: String,           // Categoria
  sellingPrice: Number,       // Preço de venda
  acquisitionCost: Number,    // Custo de aquisição
  supplier: String,           // Fornecedor
  quantityInStock: Number,    // Quantidade disponível
  minimumStock: Number,       // Limite mínimo
  maximumStock: Number,       // Limite máximo
  location: Object,           // Endereçamento WMS
  leadTimeDays: Number,       // Tempo de entrega
  salesHistory: Array,        // Histórico de vendas
  expirationDate: Date,       // Data de validade
  createdAt: Date
}
```

### Partner (Parceiro)
```javascript
{
  company: String,            // Empresa
  partnerName: String,        // Nome do parceiro
  partnerType: String,        // Tipo (fornecedor, transportadora, etc)
  cnpj: String,               // CNPJ
  contactEmail: String,       // Email de contato
  phoneNumber: String,        // Telefone
  createdAt: Date
}
```

### ReverseLogistics (Logística Reversa)
```javascript
{
  company: String,
  product: ObjectId,          // Referência a produto
  quantity: Number,           // Quantidade retornada
  reason: String,             // Motivo da reversa
  destination: String,        // Destino final
  status: String,             // Status da transação
  carbonFootprint: Number,    // Pegada de carbono
  createdAt: Date
}
```

---

## 📈 Casos de Uso

### 1️⃣ Gerenciar Inventário
1. Usuário faz login
2. Acessa Dashboard de Estoque
3. Visualiza produtos com baixo estoque
4. Reposiciona itens manualmente ou usa IA

### 2️⃣ Prever Demanda
1. Sistema analisa histórico de vendas
2. Calcula previsão para próxima semana
3. Recomenda quantidade de reposição
4. Reduz desperdício e estoque obsoleto

### 3️⃣ Processar Devolução
1. Cliente devolve produto
2. Registra reversa no sistema
3. Calcula impacto ambiental
4. Recoloca em estoque ou descarta responsavelmente

### 4️⃣ Gerar Relatório ESG
1. Gerente solicita relatório
2. Sistema compila métricas de sustentabilidade
3. Gera gráficos e insights
4. Exporta para apresentação executiva

---

## 🛠️ Desenvolvimento

### Scripts Disponíveis

```bash
# Iniciar em modo desenvolvimento (hot-reload)
npm run dev

# Iniciar em modo produção
npm start

# Rodar testes (não implementado)
npm test
```

### Dependências do Projeto

| Pacote | Versão | Propósito |
|--------|--------|----------|
| express | ^4.19.2 | Framework web |
| mongoose | ^8.4.1 | ODM MongoDB |
| jsonwebtoken | ^9.0.2 | Geração JWT |
| bcrypt | ^5.1.1 | Hash de senhas |
| cors | ^2.8.5 | CORS middleware |
| dotenv | ^16.4.5 | Variáveis de ambiente |
| nodemon | ^3.1.2 | Dev: reload automático |

---

## 📱 Interface de Usuário

### Páginas Principais

| Página | Descrição |
|--------|-----------|
| **Login** | Autenticação de usuários |
| **Register** | Cadastro de nova empresa |
| **Dashboard** | Visão geral e KPIs |
| **Stock** | Gestão de estoque |
| **Demand** | Previsão de demanda |
| **Reverse** | Logística reversa |
| **ESG** | Métricas de sustentabilidade |
| **Partners** | Gestão de parceiros |

### Temas

- 🌙 **Dark Mode** - Reduz fadiga ocular
- ☀️ **Light Mode** - Modo clássico
- 📱 **Responsivo** - Funciona em todos os dispositivos

---

## 🚢 Deployment

### Plataformas Suportadas

- **Heroku** - PaaS gratuito/pago
- **Render** - Alternativa moderna ao Heroku
- **Railway** - Deploy simplificado
- **Azure App Service** - Plataforma Microsoft
- **Docker** - Containerização

### Variáveis de Ambiente (Produção)

```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/stockvision
JWT_SECRET=seu_secret_super_seguro_e_aleatorio
CORS_ORIGIN=https://seu-dominio.com
```

---

## 📞 Suporte e Contribuição

### Como Contribuir

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Contato

- 👨‍💼 **Desenvolvedor**: Deyson Santana
- 📧 **Email**: seu-email@exemplo.com
- 🔗 **GitHub**: [@seu-usuario](https://github.com/seu-usuario)

---

## 📄 Licença

Este projeto está sob a licença **ISC** - consulte o arquivo LICENSE para detalhes.

---

## 🙏 Agradecimentos

- ❤️ SENAC pelo programa de integração
- 🚀 Comunidade Node.js
- 📚 Stack Overflow

---

**Última atualização**: 2026-07-06  
**Versão**: 1.0.0  
**Status**: ✅ Ativo e em desenvolvimento
