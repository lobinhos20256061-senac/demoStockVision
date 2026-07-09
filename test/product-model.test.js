const test = require('node:test');
const assert = require('node:assert/strict');
const Product = require('../src/backend/models/Product');
const Partner = require('../src/backend/models/Partner');
const supplyController = require('../src/backend/controllers/supplyController');

test('deve permitir cadastro de produto sem endereçamento obrigatório', () => {
  const product = new Product({
    company: 'Empresa Teste',
    name: 'Produto Teste',
    sellingPrice: 10,
    acquisitionCost: 8,
    quantityInStock: 5,
    minimumStock: 2,
    maximumStock: 10
  });

  assert.deepEqual(product.location.toObject(), {
    sector: 'Não Alocado',
    row: 'Não Alocado',
    building: 'Não Alocado',
    floor: 'Não Alocado',
    apartment: 'Não Alocado'
  });
});

test('deve filtrar fornecedores pela empresa autenticada', async () => {
  let captureFilter = null;
  const originalFind = Partner.find;

  Partner.find = async (filter) => {
    captureFilter = filter;
    return {
      sort: () => []
    };
  };

  try {
    const req = { user: { company: 'Empresa A' } };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json() {}
    };

    await supplyController.listPartners(req, res);
    assert.deepEqual(captureFilter, { company: 'Empresa A' });
  } finally {
    Partner.find = originalFind;
  }
});

test('deve associar o fornecedor à empresa do usuário ao cadastrar', async () => {
  let capturePayload = null;
  const originalCreate = Partner.create;

  Partner.create = async (payload) => {
    capturePayload = payload;
    return payload;
  };

  try {
    const req = {
      user: { company: 'Empresa B' },
      body: { companyName: 'Fornecedor X' }
    };
    const res = {
      statusCode: 201,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json() {}
    };

    await supplyController.createPartner(req, res);
    assert.equal(capturePayload.company, 'Empresa B');
  } finally {
    Partner.create = originalCreate;
  }
});

test('deve atualizar um fornecedor já existente da empresa autenticada', async () => {
  let updatedPartner = null;
  const partnerInstance = {
    companyName: 'Fornecedor Antigo',
    company: 'Empresa C',
    async save() {
      updatedPartner = this;
    }
  };

  const originalFindOne = Partner.findOne;
  Partner.findOne = async () => partnerInstance;

  try {
    const req = {
      params: { id: 'partner-1' },
      user: { company: 'Empresa C' },
      body: { companyName: 'Fornecedor Atualizado' }
    };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json() {}
    };

    await supplyController.updatePartner(req, res);
    assert.equal(updatedPartner.companyName, 'Fornecedor Atualizado');
    assert.equal(updatedPartner.company, 'Empresa C');
  } finally {
    Partner.findOne = originalFindOne;
  }
});
