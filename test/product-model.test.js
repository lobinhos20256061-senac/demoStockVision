const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
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

test('deve cadastrar produto na lista local da demo mesmo sem a flag sv_demo_mode explícita', async () => {
  class MemoryStorage {
    constructor() {
      this.store = new Map();
    }
    getItem(key) {
      return this.store.has(key) ? this.store.get(key) : null;
    }
    setItem(key, value) {
      this.store.set(key, String(value));
    }
    removeItem(key) {
      this.store.delete(key);
    }
  }

  const storage = new MemoryStorage();
  const context = {
    window: { location: { protocol: 'file:', origin: 'http://localhost' } },
    localStorage: storage,
    console,
    Date,
    setTimeout,
    clearTimeout,
    fetch: async () => ({ ok: false, json: async () => ({ message: 'fallback' }) })
  };

  vm.createContext(context);
  const apiCode = fs.readFileSync('./src/frontend/assets/js/api.js', 'utf8');
  vm.runInContext(apiCode, context);
  const tokenManager = vm.runInContext('TokenManager', context);
  const stockApi = vm.runInContext('StockAPI', context);

  storage.setItem('sv_token', 'demo-token');
  storage.setItem('sv_user', JSON.stringify({ fullname: 'Demo', company: 'Demo', role: 'demo' }));
  storage.setItem('sv_demo_session', JSON.stringify({ startedAt: Date.now(), expiresAt: Date.now() + 300000 }));

  assert.equal(tokenManager.isDemoMode(), true);

  const created = await stockApi.createProduct({
    name: 'Produto Demo Teste',
    category: 'Teste',
    acquisitionCost: 10,
    sellingPrice: 20,
    quantityInStock: 7,
    minimumStock: 2,
    maximumStock: 15,
    isIndeterminateExpiration: false,
    expirationDate: null,
    barcode: '123456',
    location: { sector: 'A', row: '1', building: 'B', floor: '1', apartment: '1' }
  });

  const inventory = await stockApi.getInventory();
  assert.equal(created.success, true);
  assert.ok(inventory.some((item) => item.name === 'Produto Demo Teste'));
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

test('deve excluir um fornecedor da empresa autenticada', async () => {
  let deletedId = null;
  let deletedCompany = null;
  const originalFindOneAndDelete = Partner.findOneAndDelete;

  Partner.findOneAndDelete = async (filter) => {
    deletedId = filter._id;
    deletedCompany = filter.company;
    return { _id: filter._id, companyName: 'Fornecedor Excluido' };
  };

  try {
    const req = {
      params: { id: 'partner-to-delete' },
      user: { company: 'Empresa D' }
    };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
      }
    };

    await supplyController.deletePartner(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(deletedId, 'partner-to-delete');
    assert.equal(deletedCompany, 'Empresa D');
  } finally {
    Partner.findOneAndDelete = originalFindOneAndDelete;
  }
});

test('deve cadastrar automaticamente um fornecedor inexistente durante ingestão de XML', async () => {
  const stockController = require('../src/backend/controllers/stockController');
  let createdPartner = null;
  
  const originalFindOne = Partner.findOne;
  const originalCreate = Partner.create;
  const originalFindOneProduct = Product.findOne;

  Partner.findOne = async () => null; // Simula que não encontrou o fornecedor
  // Mock do save do Mongoose para o Partner instanciado
  Partner.prototype.save = async function() {
    createdPartner = this;
    return this;
  };
  Product.findOne = async () => null; // Simula produto não existente no banco
  Product.prototype.save = async function() {
    return this;
  };

  try {
    const req = {
      user: { company: 'Empresa E' },
      body: {
        xmlData: `
          <nfeProc>
            <emit>
              <xNome>Fornecedor Novo do XML</xNome>
              <CNPJ>12345678000199</CNPJ>
              <fone>11999999999</fone>
              <email>fornecedor@xml.com</email>
            </emit>
            <det nItem="1">
              <xProd>Produto Teste XML</xProd>
              <qCom>10.0</qCom>
              <vUnCom>15.50</vUnCom>
            </det>
          </nfeProc>
        `
      }
    };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
      }
    };

    await stockController.importInvoiceXml(req, res);
    assert.equal(res.statusCode, 200);
    assert.ok(createdPartner);
    assert.equal(createdPartner.companyName, 'Fornecedor Novo do XML');
    assert.equal(createdPartner.company, 'Empresa E');
    assert.equal(createdPartner.email, 'fornecedor@xml.com');
  } finally {
    Partner.findOne = originalFindOne;
    Partner.create = originalCreate;
    Product.findOne = originalFindOneProduct;
  }
});

