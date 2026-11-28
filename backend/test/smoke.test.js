const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const sharp = require('sharp');

process.env.JWT_SECRET = 'smoke-test-only-secret-with-at-least-32-characters';
process.env.NODE_ENV = 'test';
process.env.CORS_ORIGIN = 'https://frontend.example.test';

const upload = require('../src/middleware/upload.middleware');
const jobService = require('../src/services/job.service');
jobService.recordJob = async () => null;
const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('backend exports an Express app and uses the configured file-size cap', () => {
  const exportedApp = require('../index');
  assert.equal(typeof exportedApp, 'function');
  assert.equal(typeof exportedApp.listen, 'function');
  assert.equal(upload.MAX_FILE_SIZE_BYTES, 50 * 1024 * 1024);
});

test('API explorer requires configured credentials and rejects anonymous requests', async () => {
  delete process.env.API_DOCS_USER;
  delete process.env.API_DOCS_PASSWORD;

  const unconfigured = await fetch(`${baseUrl}/api`);
  assert.equal(unconfigured.status, 503);
  assert.match((await unconfigured.json()).message, /API_DOCS_USER and API_DOCS_PASSWORD/);

  process.env.API_DOCS_USER = 'smoke-user';
  process.env.API_DOCS_PASSWORD = 'smoke-password';

  const anonymous = await fetch(`${baseUrl}/api`);
  assert.equal(anonymous.status, 401);

  const credentials = Buffer.from('smoke-user:smoke-password').toString('base64');
  const authenticated = await fetch(`${baseUrl}/api`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  assert.equal(authenticated.status, 200);
  assert.equal((await authenticated.json()).name, 'Resizer API Engine');
});

test('API returns a JSON 404 for unknown routes', async () => {
  const response = await fetch(`${baseUrl}/api/smoke-not-found`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, 'Not Found');
});

test('CORS allows configured and deployed frontend origins with requested headers', async () => {
  for (const origin of [
    'https://frontend.example.test',
    'https://resizer-ai.vercel.app',
    'https://resizer-pi-tan.vercel.app',
    'http://localhost:3000',
  ]) {
    const allowed = await fetch(`${baseUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization,x-requested-with',
      },
    });
    assert.equal(allowed.headers.get('access-control-allow-origin'), origin);
    assert.equal(allowed.headers.get('access-control-allow-credentials'), 'true');
    assert.match(allowed.headers.get('access-control-allow-headers'), /X-Requested-With/i);
  }

  const denied = await fetch(`${baseUrl}/api/health`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://untrusted.example.test',
      'Access-Control-Request-Method': 'GET',
    },
  });
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
});

test('single and batch image processing return the encoded output metadata', async () => {
  const image = await sharp({
    create: {
      width: 32,
      height: 24,
      channels: 3,
      background: { r: 40, g: 180, b: 90 },
    },
  }).png().toBuffer();

  const singleForm = new FormData();
  singleForm.append('image', new Blob([image], { type: 'image/png' }), 'sample.png');
  singleForm.append('format', 'png');
  const singleResponse = await fetch(`${baseUrl}/api/images/process?responseType=json`, {
    method: 'POST',
    body: singleForm,
  });
  assert.equal(singleResponse.status, 200);
  const singleResult = await singleResponse.json();
  assert.equal(singleResult.width, 32);
  assert.equal(singleResult.height, 24);
  assert.equal(singleResult.format, 'png');

  const batchForm = new FormData();
  batchForm.append('images', new Blob([image], { type: 'image/png' }), 'sample.png');
  batchForm.append('format', 'png');
  const batchResponse = await fetch(`${baseUrl}/api/images/batch?responseType=json`, {
    method: 'POST',
    body: batchForm,
  });
  assert.equal(batchResponse.status, 200);
  const batchResult = await batchResponse.json();
  assert.equal(batchResult.results[0].width, 32);
  assert.equal(batchResult.results[0].height, 24);
  assert.equal(batchResult.results[0].format, 'png');
});

test('Auth0 administration service reports unconfigured state without network access', async () => {
  const auth0Admin = require('../src/services/auth0Admin.service');

  delete process.env.AUTH0_DOMAIN;
  delete process.env.AUTH0_CLIENT_ID;
  delete process.env.AUTH0_CLIENT_SECRET;
  delete process.env.AUTH0_AUDIENCE;
  auth0Admin.clearTokenCache();

  assert.deepEqual(auth0Admin.getStatus(), {
    configured: false,
    hint: 'Auth0 Management API is not configured. Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, and AUTH0_AUDIENCE.',
  });

  await assert.rejects(
    auth0Admin.getToken(),
    (error) => error.code === 'NOT_CONFIGURED',
  );
});

test('background removal is not exposed as a backend API', async () => {
  const postResponse = await fetch(`${baseUrl}/api/images/remove-background`, { method: 'POST' });
  assert.equal(postResponse.status, 404);

  const statusResponse = await fetch(`${baseUrl}/api/images/remove-background/status`);
  assert.equal(statusResponse.status, 404);
});
