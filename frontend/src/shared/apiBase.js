export function getStoredToken() {
  return localStorage.getItem('sg_token') || '';
}

export async function apiRequest(method, path, body, customToken) {
  const token = customToken || getStoredToken();
  const response = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw Object.assign(new Error(`${response.status} ${path}`), {
      status: response.status,
    });
  }

  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('json') ? response.json() : response.text();
}
