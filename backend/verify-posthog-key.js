/**
 * Verifies the PostHog personal API key stored in backend/.env by making real
 * calls against the PostHog HTTP API — the same calls the SuperAdmin
 * "PostHog Analytics" panel makes.
 *
 * The key value is never printed (only its prefix/length).
 *
 * Run: node verify-posthog-key.js
 */
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '.env');
const posthogAdmin = require('./src/services/posthogAdmin.service');

function parseEnv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

(async () => {
  const env = parseEnv(ENV_PATH);
  const key = env.POSTHOG_PERSONAL_API_KEY || '';

  console.log('--- .env entry -------------------------------------------------');
  console.log('file              :', ENV_PATH);
  console.log('POSTHOG_PERSONAL_API_KEY present :', key ? 'YES' : 'NO');
  console.log('prefix            :', key ? `${key.slice(0, 8)}... (${key.length} chars)` : '(none)');
  console.log('valid phx_ format :', /^phx_[A-Za-z0-9]{20,}$/.test(key) ? 'YES' : 'NO');
  console.log('POSTHOG_PROJECT_ID:', env.POSTHOG_PROJECT_ID || '(unset -> defaults to 644102)');
  console.log('POSTHOG_API_HOST  :', env.POSTHOG_API_HOST || '(unset -> defaults to https://us.posthog.com)');

  if (!key) {
    console.log('\nRESULT: no key found in .env — panel will show the setup banner.');
    process.exit(1);
  }

  // Feed the .env values into process.env exactly like dotenv would at boot.
  process.env.POSTHOG_PERSONAL_API_KEY = key;
  if (env.POSTHOG_PROJECT_ID) process.env.POSTHOG_PROJECT_ID = env.POSTHOG_PROJECT_ID;
  if (env.POSTHOG_API_HOST) process.env.POSTHOG_API_HOST = env.POSTHOG_API_HOST;

  const check = async (label, fn, render) => {
    try {
      const data = await fn();
      console.log(`\n--- ${label}: OK ---`);
      render(data);
      return true;
    } catch (err) {
      console.log(`\n--- ${label}: FAILED [${err.code || '?'}] ---`);
      console.log(err.message.slice(0, 400));
      return false;
    }
  };

  console.log('\n--- live PostHog API checks ---');
  console.log('status            :', JSON.stringify(posthogAdmin.getStatus()));

  const results = [];

  results.push(await check('OVERVIEW', () => posthogAdmin.getOverview(), (ov) => {
    console.log(`  visitors (7d)  : ${ov.visitors}`);
    console.log(`  pageviews (7d) : ${ov.traffic.pageviews}`);
    console.log(`  events (7d)    : ${ov.traffic.total}`);
    console.log(`  AI gen (30d)   : ${ov.ai.total}  (success ${ov.ai.successRate}%)`);
    console.log(`  errors (30d)   : ${ov.errors.occurrences}`);
    console.log(`  top events     : ${ov.traffic.topEvents.slice(0, 8).map((e) => `${e.event}=${e.count}`).join(', ') || '(none yet)'}`);
  }));

  results.push(await check('EVENTS', () => posthogAdmin.getRecentEvents(5), (d) => {
    console.log(`  latest ${d.events.length}:`);
    d.events.forEach((e) => console.log(`   - ${e.event} @ ${e.timestamp} ${e.url ? '| ' + String(e.url).slice(0, 55) : ''}`));
  }));

  results.push(await check('AI USAGE', () => posthogAdmin.getAiUsage(), (d) => {
    console.log(`  total=${d.total} successRate=${d.successRate}% avgLatency=${d.avgLatencySeconds}s`);
    d.byProvider.forEach((p) => console.log(`   - ${p.provider}: ${p.generations} gen (${p.success} ok / ${p.failed} failed) ops=${JSON.stringify(p.operations)}`));
    if (!d.byProvider.length) console.log('   (no AI generations tracked yet)');
  }));

  results.push(await check('ERRORS', () => posthogAdmin.getErrors(), (d) => {
    console.log(`  occurrences=${d.totalOccurrences} groups=${d.grouped.length}`);
    d.grouped.slice(0, 6).forEach((g) => console.log(`   - ${g.type} x${g.count}: ${String(g.message).slice(0, 70)}`));
  }));

  results.push(await check('FEATURE FLAGS', () => posthogAdmin.listFeatureFlags(), (d) => {
    console.log(`  ${d.flags.length} flags`);
    d.flags.slice(0, 10).forEach((f) => console.log(`   - ${f.key} [${f.active ? 'active' : 'off'}]${f.archived ? ' [archived]' : ''}`));
  }));

  results.push(await check('PAGES & VISITORS', () => posthogAdmin.getPageStats(10), (d) => {
    console.log(`  ${d.pages.length} pages with traffic (${d.windowDays}d)`);
    d.pages.slice(0, 10).forEach((p) => console.log(`   - ${p.url} views=${p.views} visitors=${p.visitors}`));
  }));

  results.push(await check('SECTIONS', () => posthogAdmin.getSectionStats(10), (d) => {
    console.log(`  ${d.sections.length} sections reached`);
    d.sections.slice(0, 10).forEach((s) => console.log(`   - ${s.section} @ ${s.path} views=${s.views} visitors=${s.visitors}`));
  }));

  results.push(await check('INPUTS', () => posthogAdmin.getInputStats(10), (d) => {
    console.log(`  ${d.inputs.length} inputs used`);
    d.inputs.slice(0, 10).forEach((i) => console.log(`   - ${i.input} [${i.control}] uses=${i.uses} users=${i.users}`));
  }));

  const passed = results.filter(Boolean).length;
  console.log(`\nRESULT: ${passed}/${results.length} endpoints OK — key is ${passed === results.length ? 'VALID' : 'PARTIALLY WORKING (see failures above)'}`);
  process.exit(passed === results.length ? 0 : 1);
})().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});