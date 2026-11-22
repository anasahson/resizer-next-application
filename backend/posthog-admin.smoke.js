/**
 * Smoke test for the SuperAdmin "PostHog Analytics" endpoints.
 *
 * Covers:
 *  1. Not-configured path (no POSTHOG_PERSONAL_API_KEY) -> 200 {configured:false}
 *  2. Input validation on the flag toggle -> 400
 *  3. Bogus key -> PostHog rejects -> mapped to 502 (validates the live
 *     upstream call to the query + feature-flag endpoints)
 *  4. Full HTTP layer: route mounted, auth enforced, token accepted
 *
 * Run: node posthog-admin.smoke.js
 */
const assert = require('assert');

const controller = require('./src/controllers/posthogAdmin.controller');

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

async function call(handler, req = {}) {
  const res = mockRes();
  await handler(req, res);
  return res;
}

(async () => {
  // ---- 1. Not configured --------------------------------------------------
  delete process.env.POSTHOG_PERSONAL_API_KEY;

  let res = await call(controller.handleStatus);
  assert.strictEqual(res.statusCode, 200, 'status must be 200');
  assert.strictEqual(res.body.configured, false, 'must report configured:false');

  res = await call(controller.handleOverview);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.configured, false);
  assert.match(res.body.hint || '', /personal API key/i, 'hint must explain the missing key');
  console.log('ok: missing key -> 200 { configured:false, hint }');

  // ---- 2. Validation ------------------------------------------------------
  res = await call(controller.handleSetFlag, { params: { id: 'abc', action: 'enable' } });
  assert.strictEqual(res.statusCode, 400);
  res = await call(controller.handleSetFlag, { params: { id: '1', action: 'nope' } });
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.body.error || '', /enable or disable/);
  console.log('ok: invalid flag id / action -> 400');

  // ---- 3. Bogus key -> upstream 401 -> our 502 ---------------------------
  process.env.POSTHOG_PERSONAL_API_KEY = 'phx_smoke_test_invalid';

  res = await call(controller.handleEvents);
  assert.strictEqual(res.statusCode, 502, 'query endpoint must map upstream failure to 502');
  assert.match(res.body.error || '', /PostHog API/i);
  console.log('ok: query with bogus key -> 502:', (res.body.error || '').slice(0, 110));

  res = await call(controller.handleFlags);
  assert.strictEqual(res.statusCode, 502, 'flags endpoint must map upstream failure to 502');
  console.log('ok: feature flags with bogus key -> 502:', (res.body.error || '').slice(0, 110));

  delete process.env.POSTHOG_PERSONAL_API_KEY;
  process.env.POSTHOG_PERSONAL_API_KEY = '';

  // ---- 4. Full HTTP layer (app boots, auth enforced) ---------------------
  const app = require('./src/app');
  const jwt = require('jsonwebtoken');
  const server = app.listen(0, async () => {
    try {
      const port = server.address().port;
      const base = `http://127.0.0.1:${port}/api/admin/posthog/status`;

      const anon = await fetch(base);
      assert.strictEqual(anon.status, 401, 'anonymous request must be 401');
      console.log('ok: no token -> 401');

      const token = jwt.sign(
        { id: 1, email: 'smoke@test.local', role: 'superadmin', name: 'Smoke' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      const authed = await fetch(base, { headers: { Authorization: `Bearer ${token}` } });
      assert.strictEqual(authed.status, 200, 'superadmin token must be accepted');
      const body = await authed.json();
      assert.strictEqual(body.configured, false);
      console.log('ok: superadmin token -> 200 { configured:false }');

      const wrongRole = jwt.sign(
        { id: 2, email: 'user@test.local', role: 'user', name: 'User' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      const forbidden = await fetch(base, { headers: { Authorization: `Bearer ${wrongRole}` } });
      assert.strictEqual(forbidden.status, 403, 'non-superadmin must be 403');
      console.log('ok: non-superadmin token -> 403');

      console.log('POSTHOG ADMIN SMOKE: ALL PASSED');
      server.close(() => process.exit(0));
    } catch (err) {
      console.error('FAILED:', err.message);
      server.close(() => process.exit(1));
    }
  });
})().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
