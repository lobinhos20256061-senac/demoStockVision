const express = require('express');
const router = express.Router();
const supplyController = require('../controllers/supplyController');

const { protect } = require('../middlewares/authMiddleware');

// --- ROTAS DE SUPPLY CHAIN E INTEGRAÇÃO DE COMPRAS ---

// GET -> /api/supply/partners (Listar fornecedores cadastrados no ecossistema)
router.get('/partners', protect, supplyController.listPartners);

// POST -> /api/supply/partners (Cadastrar novos fornecedores no ecossistema)
router.post('/partners', protect, supplyController.createPartner);

// PUT -> /api/supply/partners/:id (Atualizar fornecedores do ecossistema)
router.put('/partners/:id', protect, supplyController.updatePartner);

// DELETE -> /api/supply/partners/:id (Remover fornecedor do ecossistema)
router.delete('/partners/:id', protect, supplyController.deletePartner);

// GET -> /api/supply/automated-orders (Gatilho da IA que lê o estoque e cospe as ordens prontas)
router.get('/automated-orders', protect, supplyController.generateAutomatedOrders);

module.exports = router;