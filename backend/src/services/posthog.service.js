const { PostHog } = require('posthog-node');

const POSTHOG_KEY = process.env.POSTHOG_KEY || 'phc_BLffV3wiLg4uCd22oHvA62VHFiXr2z4Gpw43N3pwR9HQ';
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';

let _client = null;

function getPostHogClient() {
  if (!_client) {
    _client = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      flushAt: 20,
      flushInterval: 10000, // flush every 10s
    });
  }
  return _client;
}

/**
 * Track a PostHog AI generation event with observability metadata.
 *
 * @param {object} params
 * @param {string} params.distinctId  - User ID or 'anonymous'
 * @param {string} params.provider    - 'openai' | 'gemini' | 'venice'
 * @param {string} params.model       - model name used
 * @param {string} params.operation   - e.g. 'generate_blog_post', 'test_connection'
 * @param {number} params.latencyMs   - how long the call took in ms
 * @param {boolean} params.success    - whether it succeeded
 * @param {number} [params.inputTokens]
 * @param {number} [params.outputTokens]
 * @param {string} [params.error]     - error message if failed
 * @param {object} [params.extra]     - any additional properties
 */
function trackAIGeneration({
  distinctId = 'anonymous',
  provider,
  model,
  operation,
  latencyMs,
  success,
  inputTokens,
  outputTokens,
  error,
  extra = {},
}) {
  try {
    const ph = getPostHogClient();
    ph.capture({
      distinctId,
      event: '$ai_generation',
      properties: {
        $ai_provider: provider,
        $ai_model: model,
        $ai_trace_id: `${operation}-${Date.now()}`,
        $ai_latency: latencyMs / 1000, // posthog expects seconds
        $ai_http_status: success ? 200 : 500,
        $ai_input_tokens: inputTokens ?? null,
        $ai_output_tokens: outputTokens ?? null,
        $ai_error: error ?? null,
        operation,
        success,
        ...extra,
      },
    });
  } catch (err) {
    // Never crash the app because of observability
    console.warn('[PostHog] Failed to track AI event:', err.message);
  }
}

/**
 * Capture a server-side exception as a PostHog `$exception` event so it shows
 * up in PostHog's Error Tracking product and in the SuperAdmin PostHog panel.
 *
 * @param {object} params
 * @param {string} [params.distinctId] - User ID or 'anonymous'
 * @param {string} [params.source]     - e.g. 'backend-express'
 * @param {string} [params.type]       - error class name, e.g. 'TypeError'
 * @param {string} params.message      - error message
 * @param {string} [params.stack]      - stack trace (truncated)
 * @param {object} [params.extra]      - additional properties
 */
function trackException({
  distinctId = 'anonymous',
  source = 'backend',
  type = 'Error',
  message,
  stack,
  extra = {},
}) {
  try {
    const ph = getPostHogClient();
    const value = String(message || 'Unknown error').slice(0, 2000);
    ph.capture({
      distinctId,
      event: '$exception',
      properties: {
        $exception_type: String(type || 'Error'),
        $exception_message: value,
        $exception_source: source,
        // Shape matches PostHog's exception_list convention so the Error
        // Tracking product can group issues by type + value.
        $exception_list: [{ type: String(type || 'Error'), value }],
        ...(stack ? { $exception_stack: String(stack).slice(0, 4000) } : {}),
        ...extra,
      },
    });
  } catch (err) {
    // Never crash the app because of observability
    console.warn('[PostHog] Failed to track exception:', err.message);
  }
}

/**
 * Shutdown PostHog client gracefully (call on process exit).
 *
 * posthog-node's shutdown() retries failed flushes internally; with an
 * unreachable host it took ~9s to settle in testing, which would stall the
 * server's SIGTERM handler. The wait is capped so observability can never
 * block process exit — pending events are dropped after `timeoutMs`.
 */
async function shutdownPostHog(timeoutMs = 3000) {
  if (!_client) return;
  const client = _client;
  _client = null;
  const flush = client.shutdown().catch((err) => {
    console.warn('[PostHog] Error while flushing on shutdown:', err.message);
  });
  let timer;
  await Promise.race([
    flush,
    new Promise((resolve) => {
      timer = setTimeout(resolve, timeoutMs);
      if (typeof timer.unref === 'function') timer.unref();
    }),
  ]);
  clearTimeout(timer);
}

module.exports = { getPostHogClient, trackAIGeneration, trackException, shutdownPostHog };
