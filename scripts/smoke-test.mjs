import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const url = process.env.API_URL ?? 'http://localhost:3000/user-id';
const nonce = randomUUID().slice(0, 12);

async function post(payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: response.status, body: await response.json() };
}

try {
  const first = await post({ id1: `smoke-${nonce}`, id2: 'A' });
  const repeated = await post({ id1: `smoke-${nonce}`, id2: 'A' });
  const different = await post({ id1: `smoke-${nonce}`, id2: 'B' });
  const invalid = await post({ id1: `smoke-${nonce}` });

  assert.equal(first.status, 200);
  assert.match(first.body.userID, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(repeated.status, 200);
  assert.equal(first.body.userID, repeated.body.userID, 'repeated pair must reuse UUID');
  assert.equal(different.status, 200);
  assert.notEqual(first.body.userID, different.body.userID, 'different pair needs another UUID');
  assert.equal(invalid.status, 400);
  console.log('PASS: new UUID, repeated pair, different pair, and invalid request');
} catch (error) {
  console.error('FAIL: smoke test:', error.message);
  process.exitCode = 1;
}
