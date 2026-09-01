import { api } from '../config';
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
