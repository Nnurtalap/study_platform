'use client';

import { PrimaryLink, TextLink } from '@/components/auth/AuthUI';
import { useIsSignedIn } from '@/hooks/useIsSignedIn';

export default function HeroActions() {
  const isSignedIn = useIsSignedIn();

  if (isSignedIn) {
    return <PrimaryLink href="/dashboard" label="Открыть кабинет →" className="px-5" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <PrimaryLink href="/register" label="Начать бесплатно" className="px-5" />
      <p className="text-sm text-ink-soft">
        Уже есть аккаунт? <TextLink href="/login">Войти</TextLink>
      </p>
    </div>
  );
}
