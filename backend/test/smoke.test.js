const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'smoke-test-only-secret-with-at-least-32-characters';
process.env.NODE_ENV = 'test';
process.env.CORS_ORIGIN = 'https://frontend.example.test';

const upload = require('../src/middleware/upload.middleware');
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

test('CORS permits the configured frontend origin only', async () => {
  const allowed = await fetch(`${baseUrl}/api/health`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://frontend.example.test',
      'Access-Control-Request-Method': 'GET',
    },
  });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://frontend.example.test');

  const denied = await fetch(`${baseUrl}/api/health`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://untrusted.example.test',
      'Access-Control-Request-Method': 'GET',
    },
  });
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
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

test('background removal endpoint requires authentication before provider access', async () => {
  const response = await fetch(`${baseUrl}/api/images/remove-background`, {
    method: 'POST',
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, 'Unauthorized');
});

test('background removal is restricted to configured accounts before provider use', async () => {
  delete process.env.REMOVE_BG_API_KEY;
  delete process.env.REMOVE_BG_ALLOWED_USER_IDS;
  const token = jwt.sign({ id: 'smoke-user', email: 'smoke@example.test', role: 'user' }, process.env.JWT_SECRET);

  const response = await fetch(`${baseUrl}/api/images/remove-background/status`);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, 'Unauthorized');

  const statusResponse = await fetch(`${baseUrl}/api/images/remove-background/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(statusResponse.status, 200);
  assert.deepEqual(await statusResponse.json(), { configured: false, available: false });

  process.env.REMOVE_BG_API_KEY = 'test-key-not-used';
  const deniedResponse = await fetch(`${baseUrl}/api/images/remove-background`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(deniedResponse.status, 403);
  assert.match((await deniedResponse.json()).error, /not enabled/);
  delete process.env.REMOVE_BG_API_KEY;
});
