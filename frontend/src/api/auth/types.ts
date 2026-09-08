export type UserRole = 'student' | 'teacher' | 'admin';

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
}
