'use client';

import { login } from '@/api/auth/auth';
import { setAccessToken } from '@/api/auth/token';
import Link from 'next/link';
import { useState } from 'react';
import { AuthHeading, AuthSuccess, AuthSwitch, FormError, SubmitButton } from './AuthUI';
import { Field } from './Field';
import { translateError } from './translateError';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { access_token } = await login(email, password);
      setAccessToken(access_token);
      setIsDone(true);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setIsLoading(false);
    }
  }

  if (isDone) {
    return (
      <AuthSuccess eyebrow="Вход выполнен" title="С возвращением." href="/" actionLabel="На главную">
        Вы вошли как <span className="font-medium text-ink">{email}</span>.
      </AuthSuccess>
    );
  }

  return (
    <div className="auth-enter">
      <AuthHeading index="01" eyebrow="Вход" title="Вход в аккаунт">
        Введите почту и пароль, указанные при регистрации.
      </AuthHeading>

      <form onSubmit={handleSubmit} className="mt-12 space-y-9">
        <Field
          index="01"
          label="Почта"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="name@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          index="02"
          label="Пароль"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="-mt-6 flex justify-end">
          <Link
            href="/forgot-password"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:text-ink focus-visible:underline"
          >
            Забыли пароль?
          </Link>
        </div>

        {error && <FormError>{error}</FormError>}

        <SubmitButton isLoading={isLoading} label="Войти" loadingLabel="Выполняется вход" />
      </form>

      <AuthSwitch question="Ещё нет аккаунта?" href="/register" label="Зарегистрироваться" />
    </div>
  );
}
