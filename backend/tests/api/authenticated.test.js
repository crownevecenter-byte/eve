const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../src/app');
const {
  tag,
  created,
  getBranch,
  getBranchOwner,
  authHeader,
  cleanup,
} = require('../helpers/testContext');

describe('Authenticated API routes', () => {
  let headers;

  after(async () => {
    await cleanup();
  });

  it('setup: branch owner auth token', async () => {
    const owner = await getBranchOwner();
    assert.ok(owner, 'Seeded BRANCH_OWNER required (run npm run seed)');
    headers = authHeader(owner);
  });

  it('GET /api/suppliers', async () => {
    const res = await request(app).get('/api/suppliers').set(headers);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.meta);
  });

  it('POST /api/suppliers creates supplier', async () => {
    const branch = await getBranch();
    const label = tag();
    const res = await request(app)
      .post('/api/suppliers')
      .set(headers)
      .send({ name: `API Sup ${label}`, contact: '03009998877', branchId: branch.id });

    assert.equal(res.status, 201);
    assert.ok(res.body.id);
    created.supplierIds.push(res.body.id);
  });

  it('GET /api/purchases', async () => {
    const res = await request(app).get('/api/purchases').set(headers);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.meta);
  });

  it('GET /api/products', async () => {
    const res = await request(app).get('/api/products?lite=1&limit=5').set(headers);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  it('GET /api/walk-in-customers', async () => {
    const branch = await getBranch();
    const res = await request(app)
      .get(`/api/walk-in-customers?branchId=${branch.id}&limit=5`)
      .set(headers);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  it('GET /api/categories', async () => {
    const res = await request(app).get('/api/categories').set(headers);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  it('GET /api/brands', async () => {
    const res = await request(app).get('/api/brands').set(headers);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  it('GET /api/inventory', async () => {
    const branch = await getBranch();
    const res = await request(app)
      .get(`/api/inventory?branchId=${branch.id}&limit=5`)
      .set(headers);
    assert.equal(res.status, 200);
    assert.ok(res.body.data || Array.isArray(res.body));
  });

  it('rejects unauthenticated /api/suppliers', async () => {
    const res = await request(app).get('/api/suppliers');
    assert.equal(res.status, 401);
  });
});
