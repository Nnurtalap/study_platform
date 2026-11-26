'use client';

import { createContext, useContext } from 'react';
import type { User } from '@/api/auth/types';

export const SessionContext = createContext<User | null>(null);

export function useUser(): User {
  const user = useContext(SessionContext);
  if (!user) throw new Error('useUser должен вызываться внутри AppShell');
  return user;
}

// Одно определение роли на меню, гейт разделов и дашборд.
// Совпадает с get_current_teacher на бэкенде: суперпользователь тоже преподаватель.
export function isTeacherUser(user: User): boolean {
  return user.role === 'teacher' || user.is_superuser;
}

export function useIsTeacher(): boolean {
  return isTeacherUser(useUser());
}
