import { clearSession, getToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function apiRequest(endpoint, options = {}) {
  const {
    skipAuth = false,
    headers: customHeaders = {},
    ...fetchOptions
  } = options;

  const token = getToken();
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    ...customHeaders,
  };

  if (token && !skipAuth) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
    ...fetchOptions,
  });

  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (response.status === 401) {
    clearSession();

    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }

    throw new Error(data?.message || 'Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Erro na comunicação com o servidor.');
  }

  return data;
}

export function extractData(result) {
  if (Array.isArray(result)) return result;
  return result?.data || [];
}

export default API_BASE_URL;
