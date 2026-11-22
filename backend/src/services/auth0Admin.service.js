const DEFAULT_TOKEN_TIMEOUT_MS = 15000;

let cachedToken = null;

function getConfiguration() {
  const domain = String(process.env.AUTH0_DOMAIN || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const clientId = String(process.env.AUTH0_CLIENT_ID || '').trim();
  const clientSecret = String(process.env.AUTH0_CLIENT_SECRET || '').trim();
  const audience = String(process.env.AUTH0_AUDIENCE || (domain ? `https://${domain}/api/v2/` : '')).trim();

  if (!domain || !clientId || !clientSecret || !audience) {
    const error = new Error(
      'Auth0 Management API is not configured. Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, and AUTH0_AUDIENCE.',
    );
    error.code = 'NOT_CONFIGURED';
    throw error;
  }

  return { domain, clientId, clientSecret, audience };
}

function getStatus() {
  try {
    getConfiguration();
    return {
      configured: true,
      audience: String(process.env.AUTH0_AUDIENCE || '').trim() || 'https://' + String(process.env.AUTH0_DOMAIN || '').trim() + '/api/v2/',
    };
  } catch (error) {
    if (error.code === 'NOT_CONFIGURED') {
      return { configured: false, hint: error.message };
    }
    throw error;
  }
}

async function getToken() {
  const config = getConfiguration();
  const now = Date.now();

  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.accessToken;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TOKEN_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`https://${config.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        audience: config.audience,
        grant_type: 'client_credentials',
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Auth0 token request timed out.');
      timeoutError.code = 'UPSTREAM_UNREACHABLE';
      throw timeoutError;
    }
    const connectionError = new Error(`Could not reach Auth0: ${error.message}`);
    connectionError.code = 'UPSTREAM_UNREACHABLE';
    throw connectionError;
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      data?.error_description || data?.error || `Auth0 returned HTTP ${response.status} while issuing a token.`,
    );
    error.code = response.status >= 500 ? 'UPSTREAM_UNREACHABLE' : 'UPSTREAM_ERROR';
    throw error;
  }

  if (!data?.access_token) {
    const error = new Error('Auth0 token response did not contain an access token.');
    error.code = 'UPSTREAM_ERROR';
    throw error;
  }

  const expiresInSeconds = Number(data.expires_in) || 86400;
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + expiresInSeconds * 1000,
  };
  return cachedToken.accessToken;
}

async function managementRequest(pathname, options = {}) {
  const config = getConfiguration();
  if (!pathname.startsWith('/api/v2/')) {
    const error = new Error('Auth0 Management API path must start with /api/v2/.');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  const token = await getToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TOKEN_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`https://${config.domain}${pathname}`, {
      method: options.method || 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        ...(options.body ? { 'content-type': 'application/json' } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Auth0 Management API request timed out.');
      timeoutError.code = 'UPSTREAM_UNREACHABLE';
      throw timeoutError;
    }
    const connectionError = new Error(`Could not reach Auth0: ${error.message}`);
    connectionError.code = 'UPSTREAM_UNREACHABLE';
    throw connectionError;
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.error_description || data?.error || `Auth0 returned HTTP ${response.status}.`,
    );
    error.code = response.status >= 500 ? 'UPSTREAM_UNREACHABLE' : 'UPSTREAM_ERROR';
    throw error;
  }

  return data;
}

async function fetchData(pathname, options) {
  return managementRequest(pathname, options);
}

async function listUsers({ page = 0, perPage = 25, search } = {}) {
  const safePage = Math.min(Math.max(Number.parseInt(page, 10) || 0, 0), 1000);
  const safePerPage = Math.min(Math.max(Number.parseInt(perPage, 10) || 25, 1), 100);
  const params = new URLSearchParams({
    page: String(safePage),
    per_page: String(safePerPage),
  });
  if (search) params.set('q', String(search));

  return managementRequest(`/api/v2/users?${params.toString()}`);
}

async function getUser(userId) {
  if (!userId) {
    const error = new Error('An Auth0 user ID is required.');
    error.code = 'BAD_REQUEST';
    throw error;
  }
  return managementRequest(`/api/v2/users/${encodeURIComponent(userId)}`);
}

function clearTokenCache() {
  cachedToken = null;
}

module.exports = {
  getToken,
  fetchData,
  managementRequest,
  getStatus,
  listUsers,
  getUser,
  clearTokenCache,
};
