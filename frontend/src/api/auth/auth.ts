import { api, apiFetch } from '../config';
import { RegisterRequest, User } from './types';

export const AUTH_ENDPOINTS = {
  register: '/api/v1/auth/register',
  login: '/api/v1/auth/login',
  logout: '/api/v1/auth/logout',
  forgotpass: '/api/v1/auth/forgot-password',
  resetpass: '/api/v1/auth/reset-password',
} as const;

export function register(data: RegisterRequest): Promise<User> {
  return api.post<User>(AUTH_ENDPOINTS.register, data);
}

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export function login(email: string, password: string): Promise<LoginResponse> {
  // fastapi-users ждёт OAuth2-форму: поля username + password
  const form = new URLSearchParams({ username: email, password });

  return apiFetch<LoginResponse>(AUTH_ENDPOINTS.login, {
    method: 'POST',
    body: form,
  });
}
