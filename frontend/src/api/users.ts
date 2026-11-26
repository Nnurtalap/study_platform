import type { User } from './auth/types';
import { authApi } from './authorized';

export function getMe(): Promise<User> {
  return authApi.get<User>('/api/v1/users/me');
}
