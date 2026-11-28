const API_URL = 'https://api.remove.bg/v1.0/removebg';
const REQUEST_TIMEOUT_MS = 60000;
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;

function getStatus() {
  return {
    configured: Boolean(process.env.REMOVE_BG_API_KEY),
    allowedUserIds: (process.env.REMOVE_BG_ALLOWED_USER_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  };
}

async function removeBackground({ buffer, filename, mimeType }) {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    const error = new Error('Background removal is not configured on the server.');
    error.status = 503;
    throw error;
  }

  const body = new FormData();
  body.append('size', 'auto');
  body.append('format', 'png');
  body.append('image_file', new Blob([buffer], { type: mimeType }), filename);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error(
        response.status === 402
          ? 'The background removal provider quota is exhausted.'
          : response.status === 429
            ? 'The background removal provider is rate limiting requests. Try again shortly.'
            : 'The background removal provider could not process this image.'
      );
      error.status = response.status === 429 ? 429 : 502;
      throw error;
    }

    const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (contentType !== 'image/png' || !response.body) {
      const error = new Error('The background removal provider returned an unexpected response.');
      error.status = 502;
      throw error;
    }

    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > MAX_OUTPUT_BYTES) {
      const error = new Error('The processed image exceeds the 4 MB response limit. Try a smaller source image.');
      error.status = 502;
      throw error;
    }

    const chunks = [];
    let totalBytes = 0;
    for await (const chunk of response.body) {
      totalBytes += chunk.byteLength;
      if (totalBytes > MAX_OUTPUT_BYTES) {
        const error = new Error('The processed image exceeds the 4 MB response limit. Try a smaller source image.');
        error.status = 502;
        throw error;
      }
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks, totalBytes);
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Background removal timed out. Please try again.');
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { getStatus, removeBackground };
