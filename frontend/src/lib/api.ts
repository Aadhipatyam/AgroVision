const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'agrovision_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body.message || `Request failed with status ${res.status}`);
  }

  return body as ApiResponse<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PUT', body: data ? JSON.stringify(data) : undefined })
};
