'use client';

import { login } from '@/api/auth/auth';
import { setAccessToken } from '@/api/auth/token';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthHeading, AuthSwitch, FormError, SubmitButton } from './AuthUI';
import { Field } from './Field';
import { translateError } from './translateError';
import { NAV_LINK } from '@/components/ui/styles';

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
            className={NAV_LINK}
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
