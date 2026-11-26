'use client';

import { PrimaryLink, TextLink } from '@/components/auth/AuthUI';
import { MONO_LABEL } from '@/components/ui/styles';
import { useIsHydrated } from '@/hooks/useIsHydrated';
import { useIsSignedIn } from '@/hooks/useIsSignedIn';

const ROW = 'flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-10';

export default function HeroActions() {
  const isHydrated = useIsHydrated();
  const isSignedIn = useIsSignedIn();

  // Пока неизвестно, вошёл ли пользователь, резервируем высоту кнопки,
  // чтобы разметка не прыгала и «Начать» не мелькало перед «Открыть кабинет»
  if (!isHydrated) {
    return (
      <div className={ROW} aria-hidden>
        <div className="h-[4.25rem] sm:w-72" />
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className={ROW}>
        <PrimaryLink href="/dashboard" label="Открыть кабинет" className="sm:w-72" />
        <p className={`flex items-center gap-3 text-ink-soft ${MONO_LABEL}`}>
          <span aria-hidden className="size-2 rounded-full bg-cobalt" />
          Вы в системе
        </p>
      </div>
    );
  }

  return (
    <div className={ROW}>
      <PrimaryLink href="/register" label="Начать" className="sm:w-72" />
      <p className="text-sm text-ink-soft">
        Уже есть аккаунт? <TextLink href="/login">Войти →</TextLink>
      </p>
    </div>
  );
}
