const test = require('node:test');
const assert = require('node:assert/strict');
const { createDemoSessionManager } = require('../src/frontend/assets/js/demoSession.js');

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); }
  };
}

test('deve iniciar uma sessão demo e expirar após o limite', () => {
  const storage = createMemoryStorage();
  const demo = createDemoSessionManager(storage, { now: () => 1_700_000_000_000 });

  const started = demo.startSession();
  assert.equal(started.active, true);
  assert.equal(demo.isActive(), true);
  assert.equal(demo.isBlocked(), false);

  const expiredDemo = createDemoSessionManager(storage, { now: () => 1_700_000_000_000 + 6 * 60 * 1000 });
  assert.equal(expiredDemo.isActive(), false);
  assert.equal(expiredDemo.isBlocked(), true);
});
