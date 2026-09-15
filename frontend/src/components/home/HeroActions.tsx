'use client';

import { PrimaryLink, TextLink } from '@/components/auth/AuthUI';
import { useIsSignedIn } from './useIsSignedIn';

export default function HeroActions() {
  const isSignedIn = useIsSignedIn();

  if (isSignedIn) {
    return (
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
        <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
          <span aria-hidden className="size-2 rounded-full bg-cobalt" />
          Вы в системе
        </p>
        <TextLink href="/logout">Выйти →</TextLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-10">
      <PrimaryLink href="/register" label="Начать" className="sm:w-72" />
      <p className="text-sm text-ink-soft">
        Уже есть аккаунт? <TextLink href="/login">Войти →</TextLink>
      </p>
    </div>
  );
}
