'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { UserRole } from '@/api/auth/types';
import { ApiError } from '@/api/config';
import { getMe } from '@/api/users';
import { translateError } from '@/components/auth/translateError';
import Logo from '@/components/ui/Logo';
import Spinner from '@/components/ui/Spinner';
import { BUTTON_GHOST, BUTTON_SECONDARY } from '@/components/ui/styles';
import { useIsHydrated } from '@/hooks/useIsHydrated';
import { useIsSignedIn } from '@/hooks/useIsSignedIn';
import { useQuery } from '@/hooks/useQuery';
import { SessionContext } from './session';

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Студент',
  teacher: 'Преподаватель',
  admin: 'Администратор',
};

const NAV = [{ href: '/dashboard', label: 'Обзор' }];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isHydrated = useIsHydrated();
  const isSignedIn = useIsSignedIn();
  const me = useQuery(isHydrated && isSignedIn ? 'me' : null, getMe);

  const isUnauthorized =
    (isHydrated && !isSignedIn) || (me.error instanceof ApiError && me.error.status === 401);

  useEffect(() => {
    if (isUnauthorized) router.replace('/login');
  }, [isUnauthorized, router]);

  if (me.error && !isUnauthorized) {
    return (
      <CenteredState>
        <p className="text-sm text-ink-soft">{translateError(me.error)}</p>
        <button type="button" onClick={me.reload} className={`${BUTTON_SECONDARY} mt-4`}>
          Повторить
        </button>
      </CenteredState>
    );
  }

  if (!me.data || isUnauthorized) {
    return (
      <CenteredState>
        <Spinner className="size-5 text-ink-soft" />
        <span className="sr-only">Загрузка</span>
      </CenteredState>
    );
  }

  const user = me.data;

  return (
    <SessionContext value={user}>
      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4 sm:px-6">
            <Logo href="/dashboard" />

            <nav aria-label="Разделы" className="hidden items-center gap-1 sm:flex">
              {NAV.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
                      isActive ? 'bg-line/60 font-medium text-ink' : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex min-w-0 items-center gap-3">
              <div className="hidden min-w-0 text-right leading-tight sm:block">
                <p className="truncate text-sm font-medium text-ink">{user.email}</p>
                <p className="text-xs text-ink-soft">
                  {user.is_superuser ? 'Суперпользователь' : ROLE_LABELS[user.role]}
                </p>
              </div>
              <Avatar email={user.email} />
              <Link href="/logout" className={BUTTON_GHOST}>
                Выйти
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">{children}</main>
      </div>
    </SessionContext>
  );
}

function Avatar({ email }: { email: string }) {
  return (
    <span
      aria-hidden
      className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold uppercase text-accent"
    >
      {email.charAt(0)}
    </span>
  );
}

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center px-4 text-center">
      {children}
    </div>
  );
}
