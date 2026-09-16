'use client';

import { login, register } from '@/api/auth/auth';
import { setAccessToken } from '@/api/auth/token';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthHeading, AuthSuccess, AuthSwitch, FormError, SubmitButton } from './AuthUI';
import { Field } from './Field';
import { NewPasswordFields } from './NewPasswordFields';
import { translateError } from './translateError';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isConfirmTouched, setIsConfirmTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const isMismatch = isConfirmTouched && confirm !== password;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setIsConfirmTouched(true);
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);

    try {
      await register({ email, password });
    } catch (err) {
      setError(translateError(err));
      setIsLoading(false);
      return;
    }

    // Аккаунт создан — сразу входим, чтобы не заставлять вводить данные повторно
    try {
      const { access_token } = await login(email, password);
      setAccessToken(access_token);
      router.replace('/dashboard');
    } catch {
      setIsRegistered(true);
      setIsLoading(false);
    }
  }

  if (isRegistered) {
    return (
      <AuthSuccess title="Аккаунт создан" href="/login" actionLabel="Перейти ко входу">
        Теперь войдите с почтой <span className="font-medium text-ink">{email}</span>.
      </AuthSuccess>
    );
  }

  return (
    <div className="fade-in">
      <AuthHeading title="Создать аккаунт">
        Нужны только почта и пароль. Новый аккаунт получает роль студента.
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
        <NewPasswordFields
          password={password}
          confirm={confirm}
          isMismatch={isMismatch}
          onPasswordChange={setPassword}
          onConfirmChange={setConfirm}
          onConfirmBlur={() => setIsConfirmTouched(confirm.length > 0)}
        />

        {error && <FormError>{error}</FormError>}

        <div className="pt-2">
          <SubmitButton isLoading={isLoading} label="Создать аккаунт" loadingLabel="Создаём аккаунт…" />
        </div>
      </form>

      <AuthSwitch question="Уже есть аккаунт?" href="/login" label="Войти" />
    </div>
  );
}
