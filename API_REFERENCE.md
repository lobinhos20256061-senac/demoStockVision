# 📖 Referência Completa da API - StockVision 2.0

> Versão atual da aplicação: 2.0.0

## 🔑 Índice de Endpoints

- [🔐 Autenticação](#autenticação)
- [📦 Estoque](#estoque)
- [🤖 Demanda](#demanda)
- [♻️ Logística Reversa](#logística-reversa)
- [🌱 ESG](#esg)
- [🤝 Parceiros](#parceiros)
- [📋 Suprimentos](#suprimentos)

---

## 🔐 Autenticação

### POST /api/auth/register

Registrar novo usuário e empresa no sistema.

**Request:**
```json
{
  "fullname": "João Silva",
  "email": "joao@empresa.com",
  "company": "Empresa XYZ Ltda",
  "password": "senha123"
}
```

**Response (201 Created):**
```json
{
  "message": "Usuário cadastrado com sucesso!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullname": "João Silva",
    "email": "joao@empresa.com",
    "company": "Empresa XYZ Ltda",
    "isAdmin": true
  }
}
```

**Erros Possíveis:**
- `400 Bad Request` - Email já existe
- `400 Bad Request` - Dados inválidos
- `500 Server Error` - Erro interno

**Regras de Validação:**
- Email deve ser válido e único
- Senha mínimo 6 caracteres
- Nome completo obrigatório
- Empresa obrigatória

---

### POST /api/auth/login

Fazer login com credenciais existentes.

**Request:**
```json
{
  "email": "joao@empresa.com",
  "password": "senha123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login realizado com sucesso!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullname": "João Silva",
    "email": "joao@empresa.com",
    "company": "Empresa XYZ Ltda",
    "isAdmin": true
  }
}
```

**Erros Possíveis:**
- `400 Bad Request` - Credenciais inválidas
- `400 Bad Request` - Usuário inativo
- `404 Not Found` - Usuário não existe

**Headers Requeridos:**
```
Content-Type: application/json
```

---

## 📦 Estoque

### GET /api/stock

Listar todos os produtos da empresa.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Query Parameters:**
```
?page=1              # Página (padrão: 1)
&limit=10            # Itens por página (padrão: 10)
&category=Eletrônicos # Filtro por categoria (opcional)
&sort=-createdAt     # Campo para ordenação (- = descendente)
```

**Response (200 OK):**
```json
{
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "company": "Empresa XYZ Ltda",
      "sku": "PROD-001",
      "name": "Notebook Dell XPS",
      "category": "Eletrônicos",
      "sellingPrice": 5999.99,
      "acquisitionCost": 3500.00,
      "supplier": "Fornecedor A",
      "quantityInStock": 25,
      "minimumStock": 10,
      "maximumStock": 100,
      "expirationDate": "2026-12-31",
      "leadTimeDays": 7,
      "salesHistory": [120, 150, 135],
      "location": {
        "sector": "A",
        "row": "01",
        "building": "1",
        "floor": "1",
        "apartment": "01"
      },
      "createdAt": "2026-07-01T10:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "pages": 5
}
```

**Status Codes:**
- `200 OK` - Sucesso
- `401 Unauthorized` - Token não fornecido/inválido
- `500 Server Error` - Erro interno

---

### GET /api/stock/:id

Obter detalhes de um produto específico.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
```
:id = ID do produto (ObjectId do MongoDB)
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "company": "Empresa XYZ Ltda",
  "sku": "PROD-001",
  "name": "Notebook Dell XPS",
  "category": "Eletrônicos",
  "sellingPrice": 5999.99,
  "acquisitionCost": 3500.00,
  "supplier": "Fornecedor A",
  "quantityInStock": 25,
  "minimumStock": 10,
  "maximumStock": 100,
  "expirationDate": "2026-12-31",
  "leadTimeDays": 7,
  "salesHistory": [120, 150, 135],
  "location": {
    "sector": "A",
    "row": "01",
    "building": "1",
    "floor": "1",
    "apartment": "01"
  },
  "createdAt": "2026-07-01T10:00:00Z"
}
```

**Erros Possíveis:**
- `404 Not Found` - Produto não existe
- `401 Unauthorized` - Acesso não autorizado

---

### POST /api/stock

Criar novo produto no estoque.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sku": "PROD-002",
  "name": "Mouse Logitech",
  "category": "Periféricos",
  "sellingPrice": 149.99,
  "acquisitionCost": 75.00,
  "supplier": "Fornecedor B",
  "quantityInStock": 100,
  "minimumStock": 20,
  "maximumStock": 200,
  "expirationDate": "2028-12-31",
  "leadTimeDays": 5,
  "location": {
    "sector": "B",
    "row": "02",
    "building": "1",
    "floor": "2",
    "apartment": "05"
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Produto criado com sucesso!",
  "product": {
    "_id": "507f1f77bcf86cd799439022",
    "company": "Empresa XYZ Ltda",
    "sku": "PROD-002",
    "name": "Mouse Logitech",
    "category": "Periféricos",
    "sellingPrice": 149.99,
    "acquisitionCost": 75.00,
    "supplier": "Fornecedor B",
    "quantityInStock": 100,
    "minimumStock": 20,
    "maximumStock": 200,
    "expirationDate": "2028-12-31",
    "leadTimeDays": 5,
    "salesHistory": [0, 0, 0],
    "location": {
      "sector": "B",
      "row": "02",
      "building": "1",
      "floor": "2",
      "apartment": "05"
    },
    "createdAt": "2026-07-06T14:30:00Z"
  }
}
```

**Validações:**
- Estoque mínimo < Estoque máximo
- Preço de venda > 0
- Custo de aquisição > 0
- SKU obrigatório
- Nome obrigatório

**Erros Possíveis:**
- `400 Bad Request` - Validação falhou
- `401 Unauthorized` - Não autenticado
- `409 Conflict` - SKU duplicado

---

### PUT /api/stock/:id

Atualizar um produto existente.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body (parcial ou completo):**
```json
{
  "quantityInStock": 50,
  "minimumStock": 15,
  "maximumStock": 150,
  "sellingPrice": 139.99
}
```

**Response (200 OK):**
```json
{
  "message": "Produto atualizado com sucesso!",
  "product": {
    "_id": "507f1f77bcf86cd799439022",
    "quantityInStock": 50,
    "minimumStock": 15,
    "maximumStock": 150,
    "sellingPrice": 139.99,
    ...
  }
}
```

**Erros Possíveis:**
- `404 Not Found` - Produto não existe
- `400 Bad Request` - Validação falhou
- `401 Unauthorized` - Não autenticado

---

### DELETE /api/stock/:id

Remover um produto do sistema.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "message": "Produto removido com sucesso!",
  "product": {
    "_id": "507f1f77bcf86cd799439022",
    "name": "Mouse Logitech"
  }
}
```

**Erros Possíveis:**
- `404 Not Found` - Produto não existe
- `401 Unauthorized` - Não autenticado

---

## 🤖 Demanda

### GET /api/demand/:productId

Prever demanda para um produto específico.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
```
:productId = ID do produto (ObjectId)
```

**Response (200 OK):**
```json
{
  "productId": "507f1f77bcf86cd799439022",
  "productName": "Mouse Logitech",
  "currentStock": 50,
  "minimumStock": 15,
  "salesHistory": [120, 150, 135],
  "forecast": {
    "averageMonthlySales": 135,
    "trend": "stable",
    "confidence": 0.85
  },
  "recommendation": {
    "recommendedQuantity": 286,
    "priority": "high",
    "rationale": "Estoque pode acabar em 4 dias com previsão de vendas"
  },
  "nextReorderDate": "2026-07-10"
}
```

**Campos Importantes:**
- `confidence` (0-1): Confiança na previsão
- `trend`: "increasing", "stable", "decreasing"
- `priority`: "low", "medium", "high", "critical"

**Erros Possíveis:**
- `404 Not Found` - Produto não existe
- `400 Bad Request` - Dados insuficientes para previsão

---

### GET /api/demand/forecast/all

Gerar previsão para todos os produtos da empresa.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
```
?priority=high   # Filtrar apenas recomendações altas (opcional)
```

**Response (200 OK):**
```json
{
  "company": "Empresa XYZ Ltda",
  "generatedAt": "2026-07-06T14:30:00Z",
  "forecasts": [
    {
      "productId": "507f1f77bcf86cd799439022",
      "productName": "Mouse Logitech",
      "forecast": {
        "averageMonthlySales": 135,
        "trend": "stable",
        "confidence": 0.85
      },
      "recommendation": {
        "recommendedQuantity": 286,
        "priority": "high"
      }
    },
    {
      "productId": "507f1f77bcf86cd799439011",
      "productName": "Notebook Dell XPS",
      "forecast": {
        "averageMonthlySales": 50,
        "trend": "increasing",
        "confidence": 0.72
      },
      "recommendation": {
        "recommendedQuantity": 200,
        "priority": "critical"
      }
    }
  ],
  "summary": {
    "totalProducts": 45,
    "productsToReorder": 12,
    "totalRecommendedInvestment": 45000.00
  }
}
```

---

## ♻️ Logística Reversa

### POST /api/reverse/entry

Registrar uma entrada de logística reversa.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439022",
  "quantity": 10,
  "reason": "devolução_cliente",
  "destination": "reciclagem",
  "notes": "Produto com defeito"
}
```

**Motivos Válidos:**
- `devolução_cliente` - Devolvido por cliente
- `retorno_fornecedor` - Retorno a fornecedor
- `reciclagem` - Descarte sustentável
- `revenda` - Remanufatura e revenda
- `doação` - Doação para ONG

**Response (201 Created):**
```json
{
  "message": "Entrada de reversa registrada com sucesso!",
  "reverseLogistics": {
    "_id": "507f1f77bcf86cd799439033",
    "company": "Empresa XYZ Ltda",
    "product": "507f1f77bcf86cd799439022",
    "quantity": 10,
    "reason": "devolução_cliente",
    "destination": "reciclagem",
    "status": "pendente",
    "carbonFootprint": 2.5,
    "createdAt": "2026-07-06T14:30:00Z"
  }
}
```

**Cálculo de Pegada de Carbono:**
```
carbonFootprint = quantity × (leadTime / 1000)
2.5 kg CO2 por movimentação
```

---

### GET /api/reverse/history

Listar histórico de transações reversas.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
```
?status=pendente        # Filtro por status
&destination=reciclagem # Filtro por destino
&limit=20              # Registros por página
&page=1                # Página
```

**Response (200 OK):**
```json
{
  "history": [
    {
      "_id": "507f1f77bcf86cd799439033",
      "productName": "Mouse Logitech",
      "quantity": 10,
      "reason": "devolução_cliente",
      "destination": "reciclagem",
      "status": "processado",
      "carbonFootprint": 2.5,
      "createdAt": "2026-07-06T14:30:00Z"
    }
  ],
  "summary": {
    "totalQuantity": 150,
    "totalCO2Saved": 37.5,
    "statusCounts": {
      "pendente": 5,
      "processado": 45,
      "finalizado": 100
    }
  }
}
```

---

### PUT /api/reverse/:id

Atualizar status de uma transação reversa.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "processado",
  "notes": "Encaminhado para reciclagem em 07/07"
}
```

**Statuses Válidos:**
- `pendente` - Aguardando processamento
- `processado` - Em processamento
- `finalizado` - Concluído
- `cancelado` - Cancelado

**Response (200 OK):**
```json
{
  "message": "Status atualizado com sucesso!",
  "reverseLogistics": {
    "_id": "507f1f77bcf86cd799439033",
    "status": "processado",
    "updatedAt": "2026-07-06T15:00:00Z"
  }
}
```

---

## 🌱 ESG

### GET /api/esg/metrics

Obter métricas ESG atuais.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "company": "Empresa XYZ Ltda",
  "period": "2026-07",
  "environmental": {
    "carbonEmissions": {
      "value": 1250.5,
      "unit": "kg CO2",
      "trend": "decreasing"
    },
    "recyclingRate": {
      "value": 45.2,
      "unit": "%",
      "trend": "increasing"
    },
    "wasteReduction": {
      "value": 300,
      "unit": "kg",
      "trend": "stable"
    }
  },
  "social": {
    "employeeCount": 50,
    "trainingHours": 240,
    "communityInvestment": {
      "value": 15000,
      "unit": "R$"
    }
  },
  "governance": {
    "complianceScore": 0.92,
    "auditsPassed": 10,
    "incidents": 0
  },
  "overallScore": 78.5,
  "lastUpdated": "2026-07-06T10:00:00Z"
}
```

---

### GET /api/esg/report

Gerar relatório ESG completo.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
```
?format=json     # json ou pdf
&period=2026-Q2  # Período (opcional)
```

**Response (200 OK - JSON):**
```json
{
  "reportId": "ESG-2026-Q2-12345",
  "company": "Empresa XYZ Ltda",
  "period": "2026-Q2",
  "executiveSummary": "Progresso sustentável em todas as frentes...",
  "sections": [
    {
      "title": "Ambiental",
      "score": 82,
      "highlights": ["Redução 15% emissões", "45% reciclagem"],
      "goals": ["Atingir carbono neutro em 2030"]
    },
    {
      "title": "Social",
      "score": 75,
      "highlights": ["Programa de diversidade", "240h treinamento"],
      "goals": ["Aumentar inclusão 20%"]
    },
    {
      "title": "Governança",
      "score": 78,
      "highlights": ["Compliance 92%", "Zero incidentes"],
      "goals": ["Implementar blockchain"]
    }
  ],
  "generatedAt": "2026-07-06T14:30:00Z"
}
```

---

### POST /api/esg/tracking

Registrar um evento ESG.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "category": "environmental",
  "eventType": "carbon_offset",
  "value": 500,
  "unit": "kg CO2",
  "description": "Plantio de 250 árvores",
  "date": "2026-07-06"
}
```

**Categorias Válidas:**
- `environmental`
- `social`
- `governance`

**Response (201 Created):**
```json
{
  "message": "Evento registrado com sucesso!",
  "tracking": {
    "_id": "507f1f77bcf86cd799439044",
    "category": "environmental",
    "eventType": "carbon_offset",
    "value": 500,
    "impactScore": 8.5,
    "createdAt": "2026-07-06T14:30:00Z"
  }
}
```

---

## 🤝 Parceiros

### GET /api/partners

Listar todos os parceiros.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
```
?type=fornecedor        # Filtro por tipo
&search=Fornecedor%20A  # Busca por nome
```

**Response (200 OK):**
```json
{
  "partners": [
    {
      "_id": "507f1f77bcf86cd799439055",
      "company": "Empresa XYZ Ltda",
      "partnerName": "Fornecedor A",
      "partnerType": "fornecedor",
      "cnpj": "12.345.678/0001-90",
      "contactEmail": "contato@fornecedora.com",
      "phoneNumber": "(11) 3000-0000",
      "location": "São Paulo, SP",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "total": 23
}
```

---

### POST /api/partners

Criar novo parceiro.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "partnerName": "Fornecedor B",
  "partnerType": "fornecedor",
  "cnpj": "98.765.432/0001-12",
  "contactEmail": "contato@fornecedorb.com",
  "phoneNumber": "(21) 3000-1111",
  "location": "Rio de Janeiro, RJ"
}
```

**Tipos de Parceiros:**
- `fornecedor` - Fornecedor de produtos
- `transportadora` - Transportadora de entregas
- `centro_distribuição` - Centro de distribuição
- `prestador_serviço` - Prestador de serviço
- `ong` - Organização não governamental

**Response (201 Created):**
```json
{
  "message": "Parceiro criado com sucesso!",
  "partner": {
    "_id": "507f1f77bcf86cd799439066",
    "partnerName": "Fornecedor B",
    "partnerType": "fornecedor",
    "cnpj": "98.765.432/0001-12",
    "contactEmail": "contato@fornecedorb.com",
    "phoneNumber": "(21) 3000-1111",
    "createdAt": "2026-07-06T14:30:00Z"
  }
}
```

---

### PUT /api/partners/:id

Atualizar informações de parceiro.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "contactEmail": "novo-email@fornecedorb.com",
  "phoneNumber": "(21) 3000-2222"
}
```

**Response (200 OK):**
```json
{
  "message": "Parceiro atualizado com sucesso!",
  "partner": { ... }
}
```

---

### DELETE /api/partners/:id

Remover parceiro.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "message": "Parceiro removido com sucesso!",
  "partner": { "_id": "507f1f77bcf86cd799439066", ... }
}
```

---

## 📋 Suprimentos

### GET /api/supply/orders

Listar pedidos de suprimento.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
```
?status=pendente   # Filtro por status
&partnerId=123     # Filtro por parceiro
```

**Response (200 OK):**
```json
{
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439077",
      "company": "Empresa XYZ Ltda",
      "partner": "507f1f77bcf86cd799439055",
      "items": [
        {
          "product": "507f1f77bcf86cd799439022",
          "quantity": 100,
          "unitPrice": 75.00,
          "total": 7500.00
        }
      ],
      "status": "pendente",
      "orderDate": "2026-07-06",
      "expectedDelivery": "2026-07-13",
      "totalAmount": 7500.00
    }
  ]
}
```

---

### POST /api/supply/orders

Criar novo pedido de suprimento.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "partnerId": "507f1f77bcf86cd799439055",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439022",
      "quantity": 50,
      "unitPrice": 75.00
    }
  ],
  "notes": "Entrega urgente"
}
```

**Response (201 Created):**
```json
{
  "message": "Pedido criado com sucesso!",
  "order": {
    "_id": "507f1f77bcf86cd799439088",
    "status": "pendente",
    "totalAmount": 3750.00,
    "expectedDelivery": "2026-07-13"
  }
}
```

---

### PUT /api/supply/orders/:id

Atualizar status do pedido.

**Headers Requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "confirmado",
  "notes": "Fornecedor confirmou entrega"
}
```

**Statuses Válidos:**
- `pendente`
- `confirmado`
- `em_trânsito`
- `entregue`
- `cancelado`

**Response (200 OK):**
```json
{
  "message": "Pedido atualizado com sucesso!",
  "order": { ... }
}
```

---

## 🔄 Códigos de Status HTTP

| Código | Significado | Ação Recomendada |
|--------|-----------|------------------|
| **200** | OK | Sucesso |
| **201** | Created | Recurso criado com sucesso |
| **204** | No Content | Sucesso mas sem conteúdo |
| **400** | Bad Request | Verifique os dados enviados |
| **401** | Unauthorized | Verifique o token JWT |
| **403** | Forbidden | Acesso não permitido |
| **404** | Not Found | Recurso não encontrado |
| **409** | Conflict | Conflito (ex: duplicado) |
| **500** | Server Error | Erro no servidor |
| **503** | Service Unavailable | Banco de dados indisponível |

---

## 🛡️ Headers Padrão

Toda requisição autenticada deve incluir:

```
Authorization: Bearer <seu_token_jwt>
Content-Type: application/json
```

---

## 📊 Formato de Resposta Padrão

**Sucesso:**
```json
{
  "message": "Descrição da ação",
  "data": { ... },
  "timestamp": "2026-07-06T14:30:00Z"
}
```

**Erro:**
```json
{
  "message": "Descrição do erro",
  "error": "error_code",
  "details": { ... },
  "timestamp": "2026-07-06T14:30:00Z"
}
```

---

## 🧪 Testando a API

### Com cURL:

```bash
# Registrar novo usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "João Silva",
    "email": "joao@empresa.com",
    "company": "Empresa XYZ",
    "password": "senha123"
  }'

# Fazer login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@empresa.com",
    "password": "senha123"
  }'

# Listar produtos (com token)
curl -X GET http://localhost:3000/api/stock \
  -H "Authorization: Bearer <TOKEN>"
```

### Com Postman:

1. Abra Postman
2. Crie nova Collection "StockVision"
3. Adicione variável `token` (vazio inicialmente)
4. Após login, use `pm.environment.set("token", pm.response.json().token)`
5. Use `{{token}}` em Authorization

---

## 📞 Suporte

Para dúvidas sobre a API:
- 📧 Email: api-support@stockvision.com
- 📚 Documentação: https://stockvision-docs.com
- 🐛 Issues: GitHub Issues do projeto

