'use client';

import { login } from '@/api/auth/auth';
import { setAccessToken } from '@/api/auth/token';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthHeading, AuthSwitch, FormError, SubmitButton } from './AuthUI';
import { Field } from './Field';
import { translateError } from './translateError';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { access_token } = await login(email, password);
      setAccessToken(access_token);
      // Кнопка остаётся в состоянии загрузки до перехода в кабинет
      router.replace('/dashboard');
    } catch (err) {
      setError(translateError(err));
      setIsLoading(false);
    }
  }

  return (
    <div className="fade-in">
      <AuthHeading title="С возвращением">
        Введите почту и пароль, указанные при регистрации.
      </AuthHeading>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field
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
          label="Пароль"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          labelAction={
            <Link
              href="/forgot-password"
              className="rounded-sm text-xs text-ink-soft outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
            >
              Забыли пароль?
            </Link>
          }
        />

        {error && <FormError>{error}</FormError>}

        <div className="pt-2">
          <SubmitButton isLoading={isLoading} label="Войти" loadingLabel="Входим…" />
        </div>
      </form>

      <AuthSwitch question="Ещё нет аккаунта?" href="/register" label="Зарегистрироваться" />
    </div>
  );
}
