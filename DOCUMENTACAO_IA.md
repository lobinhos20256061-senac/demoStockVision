# Documentação de contexto para IA — StockVision

## 1. Visão geral

StockVision é uma aplicação web full-stack para gestão de estoque, logística, previsão de demanda e indicadores ESG. A proposta principal é oferecer uma plataforma simples, didática e funcional para empresas que precisam controlar inventário, planejar reposição, gerenciar devoluções e acompanhar métricas de sustentabilidade.

O projeto foi estruturado como um sistema de exemplo/projeto integrador, com foco em aprendizado, demonstração e prototipagem de processos logísticos.

---

## 2. Objetivo do sistema

A aplicação tem como objetivo central:

- controlar produtos em estoque;
- organizar endereçamento de itens em um armazém;
- calcular indicadores financeiros e operacionais;
- sugerir ações de reposição com base em regras de negócio;
- registrar fluxos de logística reversa;
- acompanhar métricas ESG, como reciclagem e impacto de CO2;
- permitir autenticação por usuário e segregação por empresa.

---

## 3. Público-alvo e contexto de uso

A aplicação foi pensada para uso por empresas que operam com gestão de produtos e inventário, com foco em:

- armazéns;
- operações logísticas;
- gestão de suprimentos;
- controle de entradas e saídas;
- análise de demanda e risco de ruptura;
- sustentabilidade corporativa.

---

## 4. Módulos principais

### 4.1 Autenticação e permissões

- Cadastro de usuário e empresa;
- Login com JWT;
- Usuários podem ser administradores ou funcionários;
- Administradores podem cadastrar funcionários e controlar status de contas;
- O sistema usa isolamento por empresa, ou seja, os dados ficam associados à empresa do usuário autenticado.

### 4.2 Gestão de estoque

- Cadastro de produtos;
- Listagem de produtos;
- Atualização de estoque;
- Definição de estoque mínimo, máximo e localização;
- Cálculo de status visual de estoque (normal, baixo, excesso, ruptura);
- Importação de produtos via XML de nota fiscal (NF-e) para facilitar a entrada de dados em lote.

### 4.3 Previsão de demanda

- Simula um motor de IA baseado em regras heurísticas;
- Usa histórico de vendas dos últimos meses;
- Calcula demanda prevista para o próximo mês;
- Define ponto de pedido;
- Sugere compra futura com base em risco de ruptura.

### 4.4 Logística reversa

- Registro de devoluções ou retornos de materiais;
- Classificação por motivo (defeito, vencimento, descarte, reuso, etc.);
- Cálculo de métricas ESG relacionadas ao volume de itens processados;
- Ajuste automático do estoque quando um item é retornado e processado.

### 4.5 ESG

- Métricas ambientais e operacionais;
- Alertas de vencimento de produtos;
- Indicadores de impacto sustentável, como peso reciclado e CO2 evitado.

### 4.6 Parceiros e suprimentos

- Estrutura prevista para gerenciamento de fornecedores/ parceiros e suprimentos;
- O projeto contém rotas e controllers para esses módulos, ainda com foco de implementação didática.

---

## 5. Arquitetura da aplicação

### 5.1 Arquitetura geral

A aplicação segue uma arquitetura cliente-servidor simples:

- Frontend: páginas HTML, CSS e JavaScript puro;
- Backend: Node.js com Express;
- Banco de dados: MongoDB com Mongoose;
- Autenticação: JWT + bcrypt;
- Comunicação: JSON via HTTP.

### 5.2 Estrutura principal

- src/backend/server.js: ponto de entrada do servidor;
- src/backend/routes/: definição das rotas da API;
- src/backend/controllers/: lógica de negócio;
- src/backend/models/: modelos do MongoDB;
- src/backend/middlewares/: autenticação e controle de acesso;
- src/frontend/: interface web estática servida pelo backend.

---

## 6. Stack tecnológica

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcrypt
- dotenv
- cors
- nodemon (desenvolvimento)

### Frontend

- HTML5
- CSS3
- JavaScript vanilla
- Fetch API
- LocalStorage para persistência de token/estado simples

---

## 7. Modelos de dados principais

### Usuário

Representa um usuário do sistema.

Campos principais:

- fullname
- email
- company
- password (armazenada com hash)
- isAdmin
- isActive
- createdAt

### Produto

Representa um item do inventário.

Campos principais:

- company
- sku
- name
- category
- sellingPrice
- acquisitionCost
- supplier
- quantityInStock
- minimumStock
- maximumStock
- expirationDate
- isIndeterminateExpiration
- location
- leadTimeDays
- salesHistory
- createdAt

### Parceiro

Estrutura prevista para representação de fornecedores ou parceiros logísticos.

### Logística reversa

Estrutura usada para registrar retornos e devoluções.

---

## 8. Regras de negócio importantes

### 8.1 Isolamento por empresa

Os dados do usuário são filtrados pela empresa associada à sua conta. Um usuário não deve ver dados de outra organização.

### 8.2 Administração de funcionários

O administrador da empresa pode:

- cadastrar funcionários;
- listar funcionários da mesma empresa;
- alterar status de conta;
- redefinir senha em contexto corporativo.

### 8.3 Status do estoque

A aplicação define visualmente o estado do estoque:

- ruptura: sem estoque;
- estoque baixo: abaixo do mínimo;
- excesso: acima do máximo;
- normal: dentro da faixa esperada.

### 8.4 Previsão de demanda

A lógica é simplificada e didática:

- usa média ponderada dos últimos três meses de vendas;
- calcula consumo diário esperado;
- calcula ponto de pedido;
- recomenda compra urgente quando a quantidade em estoque fica abaixo do ponto ideal.

### 8.5 Processamento de devoluções

Quando um item de logística reversa é registrado, o estoque comercial pode ser reduzido conforme o motivo do retorno.

### 8.6 Importação via XML NF-e

O sistema tenta ler os campos principais de uma nota fiscal eletrônica para criar ou atualizar produtos automaticamente.

---

## 9. Endpoints principais da API

### Autenticação

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/employees
- GET /api/auth/employees
- PUT /api/auth/employees/:employeeId

### Estoque

- GET /api/stock
- POST /api/stock
- GET /api/stock/metrics
- GET /api/esg/expiration-alerts
- POST /api/stock/invoice/xml

### Demanda

- GET /api/demand/forecast
- POST /api/demand/mock-history/:id

### Logística reversa

- GET /api/reverse/analytics
- POST /api/reverse/return

### ESG

- Rotas associadas ao módulo ESG e alertas de vencimento.

---

## 10. Fluxo de uso típico

1. O usuário acessa a interface web.
2. Realiza login ou cadastro.
3. O backend gera um token JWT.
4. O frontend usa esse token para acessar módulos protegidos.
5. O usuário cadastra produtos, consulta métricas e visualiza previsões.
6. O sistema realiza cálculos e exibe indicadores de estoque, demanda e ESG.

---

## 11. Pontos importantes para IA

### Características relevantes

- O sistema é uma aplicação de gestão logística e operacional, não um e-commerce.
- O backend é relativamente simples e didático, com foco em conceitos de CRUD, autenticação, regras de negócio e arquitetura em camadas.
- Há forte uso de regras de negócio explícitas no backend, não apenas validações genéricas.
- O projeto mistura funcionalidades reais com elementos de demonstração didática, especialmente em previsão de demanda, logística reversa e importação de XML.

### Limitações/observações técnicas

- O frontend é estático, sem framework moderno.
- Não há suíte de testes automatizada configurada.
- O módulo de logística reversa usa uma estrutura em memória para alguns cenários.
- A aplicação depende de um banco MongoDB configurado via variável de ambiente.
- O servidor serve a interface frontend diretamente a partir do backend.

---

## 12. Como executar localmente

Pré-requisitos:

- Node.js
- npm
- MongoDB rodando localmente ou remoto

Variáveis de ambiente esperadas:

- PORT
- MONGODB_URI (no projeto aparece como MONGODB_URI, mas o código usa a variável de conexão do banco em configuração interna)
- JWT_SECRET

Comandos:

```bash
npm install
npm run dev
```

---

## 13. Resumo executivo para IA

StockVision é um sistema web de gestão logística e estoque desenvolvido em Node.js + Express + MongoDB, com frontend estático em HTML/CSS/JavaScript. Ele oferece autenticação por JWT, gestão de estoque com endereçamento WMS, previsão de demanda baseada em regras heurísticas, logística reversa, indicadores ESG e isolamento de dados por empresa. O projeto é estruturado em módulos de autenticação, estoque, demanda, ESG e reversa, com foco em regras de negócio e prototipagem funcional.
