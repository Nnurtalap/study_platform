'use client';

import { createContext, useContext } from 'react';
import type { User } from '@/api/auth/types';

export const SessionContext = createContext<User | null>(null);

export function useUser(): User {
  const user = useContext(SessionContext);
  if (!user) throw new Error('useUser должен вызываться внутри AppShell');
  return user;
}
