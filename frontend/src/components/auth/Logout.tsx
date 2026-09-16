'use client';

import { logout } from '@/api/auth/auth';
import { clearAccessToken, getAccessToken } from '@/api/auth/token';
import { ApiError } from '@/api/config';
import { useState } from 'react';
import { AuthHeading, AuthSuccess, AuthSwitch, FormError, SubmitButton } from './AuthUI';
import { translateError } from './translateError';

export default function Logout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const token = getAccessToken();

    try {
      if (token) await logout(token);
      clearAccessToken();
      setIsDone(true);
    } catch (err) {
      // 401 — токен уже недействителен, на сервере сессии нет: достаточно забыть его локально
      if (err instanceof ApiError && err.status === 401) {
        clearAccessToken();
        setIsDone(true);
      } else {
        setError(translateError(err));
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (isDone) {
    return (
      <AuthSuccess title="До встречи" href="/login" actionLabel="Войти снова">
        Вы вышли из аккаунта на этом устройстве.
      </AuthSuccess>
    );
  }

  return (
    <div className="fade-in">
      <AuthHeading title="Выйти из аккаунта?">
        Сессия на этом устройстве будет завершена. Чтобы вернуться, понадобится снова ввести почту и
        пароль.
      </AuthHeading>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <FormError>{error}</FormError>}

        <div className="pt-2">
          <SubmitButton isLoading={isLoading} label="Выйти" loadingLabel="Выходим…" />
        </div>
      </form>

      <AuthSwitch question="Передумали?" href="/dashboard" label="Вернуться в кабинет" />
    </div>
  );
}
