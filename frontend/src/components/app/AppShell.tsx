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
import { BUTTON_TEXT, MONO_LABEL, NAV_LINK } from '@/components/ui/styles';
import { useIsHydrated } from '@/hooks/useIsHydrated';
import { useAccessToken } from '@/hooks/useIsSignedIn';
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
  const token = useAccessToken();
  const isSignedIn = token !== null;
  // Ключ зависит от токена: вход под другим аккаунтом в соседней вкладке перезагрузит профиль
  const me = useQuery(isHydrated && isSignedIn ? `me:${token}` : null, getMe);

  const isUnauthorized =
    (isHydrated && !isSignedIn) || (me.error instanceof ApiError && me.error.status === 401);

  useEffect(() => {
    if (isUnauthorized) router.replace('/login');
  }, [isUnauthorized, router]);

  if (me.error && !isUnauthorized) {
    return (
      <CenteredState>
        <p className="text-sm text-ink-soft">{translateError(me.error)}</p>
        <button type="button" onClick={me.reload} className={`${BUTTON_TEXT} mt-4 text-sm`}>
          Повторить →
        </button>
      </CenteredState>
    );
  }

  if (!me.data || isUnauthorized) {
    return (
      <CenteredState>
        <Spinner className="bg-ink" />
        <span className="sr-only">Загрузка</span>
      </CenteredState>
    );
  }

  const user = me.data;

  return (
    <SessionContext value={user}>
      <div className="flex flex-1 flex-col bg-paper px-6 py-8 text-ink sm:px-12 lg:min-h-dvh lg:px-16 xl:px-24">
        <header className="relative flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t-2 border-ink pt-3 pb-1">
          <span aria-hidden className="absolute -top-0.5 left-0 h-0.5 w-6 bg-signal" />
          <div className="flex items-center gap-8">
            <Logo href="/dashboard" />
            <nav aria-label="Разделы" className="flex items-baseline gap-6">
              {NAV.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`${NAV_LINK} ${isActive ? 'text-ink' : ''}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex min-w-0 items-baseline gap-6">
            <span className={`hidden min-w-0 truncate text-ink-soft sm:block ${MONO_LABEL}`}>
              {user.email} · {user.is_superuser ? 'Суперпользователь' : ROLE_LABELS[user.role]}
            </span>
            <Link href="/logout" className={NAV_LINK}>
              Выйти
            </Link>
          </div>
        </header>

        {/* Смена пользователя сбрасывает все загруженные данные страницы */}
        <main key={user.id} className="flex-1 py-12 lg:py-16">
          {children}
        </main>

        <footer className={`flex justify-between border-t border-ink/15 pt-4 text-ink-soft ${MONO_LABEL}`}>
          <span>© 2026</span>
          <span>Кабинет</span>
        </footer>
      </div>
    </SessionContext>
  );
}

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-paper px-6 text-center text-ink">
      {children}
    </div>
  );
}
