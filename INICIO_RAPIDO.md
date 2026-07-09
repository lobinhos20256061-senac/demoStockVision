# ⚡ Guia Rápido - 5 Minutos (StockVision 2.0)

Comece com o StockVision em 5 minutos! ⏱️

---

## 1️⃣ Clonar Repositório

```bash
git clone https://github.com/seu-usuario/stockvision.git
cd StockVision
```

---

## 2️⃣ Instalar Dependências

```bash
npm install
```

---

## 3️⃣ Configurar `.env`

Crie arquivo `.env` na raiz:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/stockvision
JWT_SECRET=seu_secret_super_seguro_aqui
```

---

## 4️⃣ Iniciar MongoDB

**Windows:**
```bash
net start MongoDB
```

**Mac:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

---

## 5️⃣ Rodar Aplicação

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## ✅ Pronto!

```
✓ Servidor rodando em http://localhost:3000
✓ BD conectado
✓ Pronto para desenvolvimento
```

### Próximas Etapas:
- 📖 Leia [INDICE.md](INDICE.md) para documentação completa
- 🔐 Teste login em http://localhost:3000
- 📚 Consulte [API_REFERENCE.md](API_REFERENCE.md) para endpoints

---

## 🐛 Problema?

| Erro | Solução |
|------|---------|
| Port 3000 em uso | Mude em `.env`: `PORT=3001` |
| MongoDB não conecta | Inicie serviço MongoDB |
| npm install falha | `rm -rf node_modules && npm install` |

👉 Veja [FAQ_TROUBLESHOOTING.md](FAQ_TROUBLESHOOTING.md) para mais

---

**Tudo funcionando? Bora desenvolver! 🚀**

