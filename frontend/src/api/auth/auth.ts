import { api, apiFetch } from '../config';
import { RegisterRequest, User } from './types';

export const AUTH_ENDPOINTS = {
  register: '/api/v1/auth/register',
  login: '/api/v1/auth/login',
  logout: '/api/v1/auth/logout',
  forgotpass: '/api/v1/auth/forgot-password',
  resetpass: '/api/v1/auth/reset-password',
  requestVerify: '/api/v1/users/request-verify-token',
  verify: '/api/v1/users/verify',
} as const;

export function register(data: RegisterRequest): Promise<User> {
  return api.post<User>(AUTH_ENDPOINTS.register, data);
}

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export function login(email: string, password: string): Promise<LoginResponse> {
  const form = new URLSearchParams({ username: email, password });

  return apiFetch<LoginResponse>(AUTH_ENDPOINTS.login, {
    method: 'POST',
    body: form,
  });
}

export function logout(token: string): Promise<void> {
  return api.post<void>(AUTH_ENDPOINTS.logout, undefined, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function forgotPassword(email: string): Promise<void> {
  return api.post<void>(AUTH_ENDPOINTS.forgotpass, { email });
}

export function resetPassword(token: string, password: string): Promise<void> {
  return api.post<void>(AUTH_ENDPOINTS.resetpass, { token, password });
}

export function requestVerifyToken(email: string): Promise<void> {
  return api.post<void>(AUTH_ENDPOINTS.requestVerify, { email });
}

export function verifyEmail(token: string): Promise<User> {
  return api.post<User>(AUTH_ENDPOINTS.verify, { token });
}
