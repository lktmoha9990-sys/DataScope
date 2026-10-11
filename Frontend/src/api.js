const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
let csrfToken = '';

async function loadCsrfToken() {
  const response = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.csrf_token) throw new Error('Could not start a secure session. Please refresh and try again.');
  csrfToken = result.csrf_token;
  return csrfToken;
}

async function request(path, options = {}, retryCsrf = true) {
  const method = (options.method || 'GET').toUpperCase();
  const writes = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  if (writes && !csrfToken) await loadCsrfToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(writes ? { 'X-CSRF-TOKEN': csrfToken } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (body.csrf_token) csrfToken = body.csrf_token;

  if (response.status === 419 && writes && retryCsrf) {
    csrfToken = '';
    await loadCsrfToken();
    return request(path, options, false);
  }

  if (!response.ok) {
    const validation = body.errors ? Object.values(body.errors).flat().join(' ') : '';
    throw new Error(validation || body.message || `Request failed (${response.status})`);
  }
  return body;
}

export function getJson(path, signal) {
  return request(path, { signal });
}

export function mutateJson(path, method, data) {
  return request(path, { method, ...(data ? { body: JSON.stringify(data) } : {}) });
}
