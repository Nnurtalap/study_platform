'use client';

import Link from 'next/link';
import { useIsSignedIn } from './useIsSignedIn';

const NAV_LINK =
  'font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:text-ink focus-visible:underline';

export default function HomeNav() {
  const isSignedIn = useIsSignedIn();

  return (
    <nav aria-label="Аккаунт" className="flex items-baseline gap-6">
      {isSignedIn ? (
        <Link href="/logout" className={NAV_LINK}>
          Выйти
        </Link>
      ) : (
        <>
          <Link href="/login" className={NAV_LINK}>
            Вход
          </Link>
          <Link href="/register" className={NAV_LINK}>
            Регистрация
          </Link>
        </>
      )}
    </nav>
  );
}
