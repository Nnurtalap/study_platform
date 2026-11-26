import { clearAccessToken, getAccessToken } from './auth/token';
import { ApiError, apiFetch } from './config';

type Options = Parameters<typeof apiFetch>[1];

// Запрос от имени вошедшего пользователя. 401 значит, что токен протух или отозван:
// забываем его, а AppShell сам отправит на страницу входа.
async function authFetch<T>(endpoint: string, options: Options = {}): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new ApiError(401, null, 'Требуется вход');

  try {
    return await apiFetch<T>(endpoint, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) clearAccessToken();
    throw err;
  }
}

export const authApi = {
  get: <T>(endpoint: string, options?: Options) =>
    authFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: Options) =>
    authFetch<T>(endpoint, { ...options, method: 'POST', body }),
};
