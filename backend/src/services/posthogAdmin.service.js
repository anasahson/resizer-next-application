/**
 * PostHog admin data service — reads analytics back out of PostHog for the
 * SuperAdmin control center "PostHog Analytics" panel.
 *
 * IMPORTANT: this uses a *personal* API key (phx_...), NOT the project key
 * (phc_...) that posthog.service.js uses for ingestion — the project key can
 * only write events, never read them.
 *
 * Required env (see backend/.env.example):
 *   POSTHOG_PERSONAL_API_KEY  phx_... with scopes: query:read,
 *                             feature_flag:read, feature_flag:write
 *   POSTHOG_PROJECT_ID        defaults to 644102 (this project)
 *   POSTHOG_API_HOST          defaults to https://us.posthog.com
 *                             (EU cloud: https://eu.posthog.com — note this is
 *                             the HTTP API host, NOT the SDK host
 *                             us.i.posthog.com)
 */

const DEFAULT_PROJECT_ID = '644102';
const DEFAULT_API_HOST = 'https://us.posthog.com';

function getConfig() {
  const key = process.env.POSTHOG_PERSONAL_API_KEY || '';
  const projectId = String(process.env.POSTHOG_PROJECT_ID || DEFAULT_PROJECT_ID);
  const host = (process.env.POSTHOG_API_HOST || DEFAULT_API_HOST).replace(/\/+$/, '');
  return { key, projectId, host, configured: key.length > 0 };
}

function notConfiguredError() {
  const err = new Error(
    'PostHog personal API key is not configured. Set POSTHOG_PERSONAL_API_KEY (phx_...) in backend/.env — create one in PostHog -> Settings -> Personal API keys with scopes: query:read, feature_flag:read, feature_flag:write. Then restart the backend.'
  );
  err.code = 'NOT_CONFIGURED';
  return err;
}

/**
 * Call the PostHog HTTP API. Throws errors carrying a `code`:
 *  - NOT_CONFIGURED         no personal API key set
 *  - UPSTREAM_ERROR         PostHog replied with a non-2xx status
 *  - UPSTREAM_UNREACHABLE   network-level failure reaching the host
 */
async function phFetch(path, { method = 'GET', body } = {}) {
  const { key, host } = getConfig();
  if (!key) throw notConfiguredError();

  let res;
  try {
    res = await fetch(`${host}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (netErr) {
    const err = new Error(`Cannot reach the PostHog API at ${host}: ${netErr.message}`);
    err.code = 'UPSTREAM_UNREACHABLE';
    throw err;
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    let detail = data && (data.detail || data.error);
    if (!detail && Array.isArray(data) && data.length) detail = JSON.stringify(data[0]);
    if (!detail) detail = `HTTP ${res.status}`;
    if (typeof detail !== 'string') detail = JSON.stringify(detail);
    const err = new Error(`PostHog API ${method} ${path} failed (${res.status}): ${detail}`);
    err.code = 'UPSTREAM_ERROR';
    err.status = res.status;
    throw err;
  }
  return data;
}

/**
 * Run a HogQL query via POST /api/projects/:id/query/ and normalize the
 * response. HogQL responses are `{ results: any[][], columns: string[] }`;
 * we zip columns onto each row so callers can use plain objects.
 */
async function runHogQL(query, name) {
  const { projectId } = getConfig();
  const data = await phFetch(`/api/projects/${projectId}/query/`, {
    method: 'POST',
    body: { query: { kind: 'HogQLQuery', query }, name },
  });
  const columns = Array.isArray(data?.columns) ? data.columns : [];
  const raw = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data?.rows) ? data.rows : [];
  const rows = raw.map((row) => {
    if (row && typeof row === 'object' && !Array.isArray(row)) return row;
    if (Array.isArray(row) && columns.length === row.length) {
      return Object.fromEntries(columns.map((c, i) => [c, row[i]]));
    }
    return row;
  });
  return { columns, rows };
}

const asNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const asBool = (v) => v === true || v === 1 || v === '1' || v === 'true' || v === 't';


/** Top events + pageviews + visitors for the last 7 days. */
async function getOverview() {
  const [traffic, visitors, ai, errors] = await Promise.all([
    runHogQL(
      `SELECT event, count() AS c FROM events WHERE timestamp >= now() - INTERVAL 7 DAY GROUP BY event ORDER BY c DESC LIMIT 25`,
      'admin overview: top events 7d'
    ),
    runHogQL(
      `SELECT count(DISTINCT distinct_id) AS visitors FROM events WHERE timestamp >= now() - INTERVAL 7 DAY`,
      'admin overview: visitors 7d'
    ),
    runHogQL(
      `SELECT properties.$ai_provider AS provider, properties.success AS success, count() AS c FROM events WHERE event = '$ai_generation' AND timestamp >= now() - INTERVAL 30 DAY GROUP BY provider, success`,
      'admin overview: ai generations 30d'
    ),
    runHogQL(
      `SELECT properties.$exception_type AS type, count() AS c FROM events WHERE event = '$exception' AND timestamp >= now() - INTERVAL 30 DAY GROUP BY type ORDER BY c DESC LIMIT 25`,
      'admin overview: exceptions 30d'
    ),
  ]);

  const topEvents = traffic.rows.map((r) => ({ event: r.event, count: asNumber(r.c) }));
  const find = (name) => topEvents.find((e) => e.event === name)?.count || 0;

  let aiTotal = 0;
  let aiSuccess = 0;
  for (const r of ai.rows) {
    const c = asNumber(r.c);
    aiTotal += c;
    if (asBool(r.success)) aiSuccess += c;
  }
  const errorOccurrences = errors.rows.reduce((sum, r) => sum + asNumber(r.c), 0);

  const { projectId, host } = getConfig();
  return {
    configured: true,
    projectId,
    host,
    windows: { trafficDays: 7, aiDays: 30 },
    traffic: {
      pageviews: find('$pageview'),
      pageleaves: find('$pageleave'),
      total: topEvents.reduce((sum, e) => sum + e.count, 0),
      topEvents,
    },
    visitors: asNumber(visitors.rows[0]?.visitors),
    ai: {
      total: aiTotal,
      success: aiSuccess,
      failed: aiTotal - aiSuccess,
      successRate: aiTotal ? Math.round((aiSuccess / aiTotal) * 1000) / 10 : 0,
      byType: errors.rows.map((r) => ({ type: r.type || 'Unknown', count: asNumber(r.c) })),
    },
    errors: {
      occurrences: errorOccurrences,
      distinctTypes: errors.rows.length,
    },
  };
}

/** Most recent raw events (all types) for the events table. */
async function getRecentEvents(limit = 30) {
  const capped = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const { rows } = await runHogQL(
    `SELECT event, timestamp, distinct_id, properties.$current_url AS url FROM events ORDER BY timestamp DESC LIMIT ${capped}`,
    'admin: recent events'
  );
  return {
    events: rows.map((r) => ({
      event: r.event,
      timestamp: r.timestamp,
      distinctId: r.distinct_id,
      url: r.url || null,
    })),
  };
}

/** $exception events grouped by type/message for the errors table. */
async function getErrors(limit = 25) {
  const capped = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const [grouped, recent] = await Promise.all([
    runHogQL(
      `SELECT properties.$exception_type AS type, properties.$exception_message AS message, count() AS c, max(timestamp) AS last_seen FROM events WHERE event = '$exception' AND timestamp >= now() - INTERVAL 30 DAY GROUP BY type, message ORDER BY c DESC LIMIT ${capped}`,
      'admin: exceptions grouped 30d'
    ),
    runHogQL(
      `SELECT timestamp, distinct_id, properties.$exception_type AS type, properties.$exception_message AS message, properties.$exception_source AS source FROM events WHERE event = '$exception' ORDER BY timestamp DESC LIMIT 10`,
      'admin: recent exceptions'
    ),
  ]);
  return {
    grouped: grouped.rows.map((r) => ({
      type: r.type || 'Unknown',
      message: r.message || '(no message)',
      count: asNumber(r.c),
      lastSeen: r.last_seen || null,
    })),
    recent: recent.rows.map((r) => ({
      timestamp: r.timestamp,
      distinctId: r.distinct_id,
      type: r.type || 'Unknown',
      message: r.message || '(no message)',
      source: r.source || 'unknown',
    })),
    totalOccurrences: grouped.rows.reduce((sum, r) => sum + asNumber(r.c), 0),
  };
}

/** $ai_generation breakdown by provider/operation/success (last 30 days). */
async function getAiUsage() {
  const baseWhere = `event = '$ai_generation' AND timestamp >= now() - INTERVAL 30 DAY`;
  const [groups, errors] = await Promise.all([
    runHogQL(
      `SELECT properties.$ai_provider AS provider, properties.operation AS operation, properties.success AS success, count() AS c FROM events WHERE ${baseWhere} GROUP BY provider, operation, success ORDER BY c DESC LIMIT 100`,
      'admin: ai usage by provider 30d'
    ),
    runHogQL(
      `SELECT properties.$ai_provider AS provider, properties.$ai_error AS error, count() AS c FROM events WHERE ${baseWhere} AND properties.success = 'false' GROUP BY provider, error ORDER BY c DESC LIMIT 25`,
      'admin: ai failures 30d'
    ),
  ]);

  // Latency is best-effort: numeric casting of a JSON property can fail on
  // odd data, and it must never take the whole panel down.
  let avgLatencySeconds = null;
  try {
    const latency = await runHogQL(
      `SELECT avg(toFloat64OrZero(properties.$ai_latency)) AS avg_latency FROM events WHERE ${baseWhere} AND toFloat64OrZero(properties.$ai_latency) > 0`,
      'admin: ai avg latency 30d'
    );
    avgLatencySeconds = latency.rows[0]?.avg_latency != null ? Number(latency.rows[0].avg_latency) : null;
    if (avgLatencySeconds != null && !Number.isFinite(avgLatencySeconds)) avgLatencySeconds = null;
  } catch {
    avgLatencySeconds = null;
  }

  const byProvider = {};
  let total = 0;
  let success = 0;
  for (const r of groups.rows) {
    const provider = r.provider || 'unknown';
    const op = r.operation || 'unknown';
    const c = asNumber(r.c);
    const ok = asBool(r.success);
    total += c;
    if (ok) success += c;
    if (!byProvider[provider]) {
      byProvider[provider] = { provider, generations: 0, success: 0, failed: 0, operations: {} };
    }
    const bucket = byProvider[provider];
    bucket.generations += c;
    if (ok) bucket.success += c;
    else bucket.failed += c;
    bucket.operations[op] = (bucket.operations[op] || 0) + c;
  }

  return {
    windowDays: 30,
    total,
    success,
    failed: total - success,
    successRate: total ? Math.round((success / total) * 1000) / 10 : 0,
    avgLatencySeconds: avgLatencySeconds != null ? Math.round(avgLatencySeconds * 100) / 100 : null,
    byProvider: Object.values(byProvider).map((b) => ({
      ...b,
      operations: Object.entries(b.operations).map(([operation, count]) => ({ operation, count })),
    })),
    recentErrors: errors.rows.map((r) => ({
      provider: r.provider || 'unknown',
      error: r.error || '(no message)',
      count: asNumber(r.c),
    })),
  };
}

/** All feature flags for the flags tab. */
async function listFeatureFlags() {
  const { projectId } = getConfig();
  const data = await phFetch(`/api/projects/${projectId}/feature_flags/?limit=100`);
  const results = Array.isArray(data?.results) ? data.results : [];
  return {
    flags: results
      .filter((f) => !f.deleted)
      .map((f) => ({
        id: f.id,
        key: f.key,
        name: f.name || f.key,
        active: !!f.active,
        archived: !!f.archived,
        rollout: typeof f.rollout_percentage === 'number' ? f.rollout_percentage : null,
        createdAt: f.created_at || null,
        tags: Array.isArray(f.tags) ? f.tags.filter(Boolean) : [],
      })),
  };
}

/** Enable or disable a feature flag (POST .../enable/ | .../disable/). */
async function setFeatureFlag(flagId, enable) {
  const id = String(flagId);
  if (!/^\d+$/.test(id)) {
    const err = new Error(`Invalid feature flag id: ${id}`);
    err.code = 'BAD_REQUEST';
    throw err;
  }
  const { projectId } = getConfig();
  const data = await phFetch(`/api/projects/${projectId}/feature_flags/${id}/${enable ? 'enable' : 'disable'}/`, {
    method: 'POST',
    body: {},
  });
  return { id: data?.id, key: data?.key, active: !!data?.active };
}

/** Config status for the panel header (no secrets exposed). */
function getStatus() {
  const { projectId, host, configured } = getConfig();
  return { configured, projectId, host };
}

/**
 * Per-page traffic — how many pageviews and unique visitors each URL gets.
 * Reads the `$pageview` events captured by PostHogProvider.
 */
async function getPageStats(limit = 60, days = 30) {
  const d = Math.min(Math.max(Number(days) || 30, 1), 90);
  const capped = Math.min(Math.max(Number(limit) || 60, 1), 200);
  const { rows } = await runHogQL(
    `SELECT properties.$current_url AS url, count() AS views, count(DISTINCT distinct_id) AS visitors, max(timestamp) AS last_seen FROM events WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${d} DAY GROUP BY url ORDER BY views DESC LIMIT ${capped}`,
    'admin: per-page traffic'
  );
  return {
    windowDays: d,
    pages: rows.map((r) => ({
      url: r.url || '(unknown)',
      views: asNumber(r.views),
      visitors: asNumber(r.visitors),
      lastSeen: r.last_seen || null,
    })),
  };
}

/** Which page sections visitors actually reached ($section_view events). */
async function getSectionStats(limit = 100, days = 30) {
  const d = Math.min(Math.max(Number(days) || 30, 1), 90);
  const capped = Math.min(Math.max(Number(limit) || 100, 1), 200);
  const { rows } = await runHogQL(
    `SELECT properties.$section AS section, properties.$section_path AS path, count() AS views, count(DISTINCT distinct_id) AS visitors FROM events WHERE event = '$section_view' AND timestamp >= now() - INTERVAL ${d} DAY GROUP BY section, path ORDER BY views DESC LIMIT ${capped}`,
    'admin: section visibility'
  );
  return {
    windowDays: d,
    sections: rows.map((r) => ({
      section: r.section || 'unknown',
      path: r.path || '(unknown)',
      views: asNumber(r.views),
      visitors: asNumber(r.visitors),
    })),
  };
}

/** Which form inputs visitors used ($input_used events, values bucketed). */
async function getInputStats(limit = 100, days = 30) {
  const d = Math.min(Math.max(Number(days) || 30, 1), 90);
  const capped = Math.min(Math.max(Number(limit) || 100, 1), 200);
  const { rows } = await runHogQL(
    `SELECT properties.$input AS input, properties.$control AS control, count() AS uses, count(DISTINCT distinct_id) AS users, max(timestamp) AS last_used FROM events WHERE event = '$input_used' AND timestamp >= now() - INTERVAL ${d} DAY GROUP BY input, control ORDER BY uses DESC LIMIT ${capped}`,
    'admin: input usage'
  );
  return {
    windowDays: d,
    inputs: rows.map((r) => ({
      input: r.input || 'unnamed',
      control: r.control || 'unknown',
      uses: asNumber(r.uses),
      users: asNumber(r.users),
      lastUsed: r.last_used || null,
    })),
  };
}

module.exports = {
  getStatus,
  getOverview,
  getRecentEvents,
  getErrors,
  getAiUsage,
  listFeatureFlags,
  setFeatureFlag,
  getPageStats,
  getSectionStats,
  getInputStats,
};
