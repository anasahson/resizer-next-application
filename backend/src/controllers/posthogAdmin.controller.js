const posthogAdmin = require('../services/posthogAdmin.service');
const { listHostingLogs, hostingLogsCsv, currentLogFile } = require('../services/hostingLog.service');

/**
 * Wraps a handler so PostHog service errors map to consistent responses:
 *  - NOT_CONFIGURED        -> 200 { configured:false, hint } so the panel can
 *                             render setup instructions instead of an error
 *  - UPSTREAM_*            -> 502 with the upstream message
 *  - BAD_REQUEST           -> 400
 */
const wrap = (handler) => async (req, res) => {
  try {
    return await handler(req, res);
  } catch (err) {
    if (err.code === 'NOT_CONFIGURED') {
      return res.status(200).json({ configured: false, hint: err.message });
    }
    if (err.code === 'UPSTREAM_ERROR' || err.code === 'UPSTREAM_UNREACHABLE') {
      return res.status(502).json({ configured: true, error: err.message });
    }
    if (err.code === 'BAD_REQUEST') {
      return res.status(400).json({ error: err.message });
    }
    console.error('[PostHog admin]', err.message);
    return res.status(500).json({ error: 'PostHog admin request failed', message: err.message });
  }
};

const handleStatus = wrap(async (req, res) => res.json(posthogAdmin.getStatus()));

const handleOverview = wrap(async (req, res) => res.json(await posthogAdmin.getOverview()));

const handleEvents = wrap(async (req, res) =>
  res.json(await posthogAdmin.getRecentEvents(req.query?.limit))
);

const handleErrors = wrap(async (req, res) =>
  res.json(await posthogAdmin.getErrors(req.query?.limit))
);

const handleAiUsage = wrap(async (req, res) => res.json(await posthogAdmin.getAiUsage()));

const handleFlags = wrap(async (req, res) => res.json(await posthogAdmin.listFeatureFlags()));

const handlePages = wrap(async (req, res) =>
  res.json(await posthogAdmin.getPageStats(req.query?.limit, req.query?.days))
);

const handleSections = wrap(async (req, res) =>
  res.json(await posthogAdmin.getSectionStats(req.query?.limit, req.query?.days))
);

const handleInputs = wrap(async (req, res) =>
  res.json(await posthogAdmin.getInputStats(req.query?.limit, req.query?.days))
);

const handleSetFlag = wrap(async (req, res) => {
  const { id, action } = req.params;
  if (action !== 'enable' && action !== 'disable') {
    return res.status(400).json({ error: `Unknown action "${action}" — use enable or disable.` });
  }
  const result = await posthogAdmin.setFeatureFlag(id, action === 'enable');
  return res.json({ success: true, ...result });
});

/**
 * GET /api/admin/hosting/logs?limit=&status=&source=
 * Recent image hosting attempts (source, timing, outcome, failure reason).
 */
const handleListHostingLogs = async (req, res) => {
  try {
    const rows = await listHostingLogs({
      limit: req.query.limit,
      status: req.query.status,
      source: req.query.source,
    });
    return res.json({
      success: true,
      count: rows.length,
      logFile: currentLogFile(),
      logs: rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Could not read hosting logs' });
  }
};

/** GET /api/admin/hosting/logs.csv — download the log as a spreadsheet. */
const handleDownloadHostingLogsCsv = async (req, res) => {
  try {
    const csv = await hostingLogsCsv({ status: req.query.status, source: req.query.source });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="hosting-logs-${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Could not build CSV' });
  }
};

module.exports = {
  handleStatus,
  handleOverview,
  handleEvents,
  handleErrors,
  handleAiUsage,
  handleFlags,
  handleSetFlag,
  handlePages,
  handleSections,
  handleInputs,
  handleListHostingLogs,
  handleDownloadHostingLogsCsv,
};
