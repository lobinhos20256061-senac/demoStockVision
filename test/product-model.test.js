const test = require('node:test');
const assert = require('node:assert/strict');
const Product = require('../src/backend/models/Product');

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
