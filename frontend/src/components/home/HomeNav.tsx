'use client';

import Link from 'next/link';
import { BUTTON_GHOST, BUTTON_PRIMARY } from '@/components/ui/styles';
import { useIsSignedIn } from '@/hooks/useIsSignedIn';

export default function HomeNav() {
  const isSignedIn = useIsSignedIn();

  return (
    <nav aria-label="Аккаунт" className="flex items-center gap-1">
      {isSignedIn ? (
        <>
          <Link href="/logout" className={BUTTON_GHOST}>
            Выйти
          </Link>
          <Link href="/dashboard" className={`${BUTTON_PRIMARY} h-9`}>
            Кабинет
          </Link>
        </>
      ) : (
        <>
          <Link href="/login" className={BUTTON_GHOST}>
            Вход
          </Link>
          <Link href="/register" className={`${BUTTON_PRIMARY} h-9`}>
            Регистрация
          </Link>
        </>
      )}
    </nav>
  );
}
