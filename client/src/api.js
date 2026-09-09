const BASE = import.meta.env.VITE_API_BASE ?? '';

class ApiError extends Error {
  constructor(message, { status, errors } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors ?? {};
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: options.body ? { 'content-type': 'application/json' } : undefined,
    });
  } catch {
    throw new ApiError('Не удалось связаться с сервером');
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(data?.message ?? `Ошибка ${res.status}`, {
      status: res.status,
      errors: data?.errors,
    });
  }
  return data;
}

export const api = {
  list(status) {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/api/requests${query}`);
  },
  create(payload) {
    return request('/api/requests', { method: 'POST', body: JSON.stringify(payload) });
  },
  approve(id) {
    return request(`/api/requests/${id}/approve`, { method: 'POST', body: '{}' });
  },
  reject(id, rejectionReason) {
    return request(`/api/requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });
  },
};

export { ApiError };