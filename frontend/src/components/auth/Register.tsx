'use client';

import { login, register } from '@/api/auth/auth';
import { setAccessToken } from '@/api/auth/token';
import { useState } from 'react';
import { AuthHeading, AuthSuccess, AuthSwitch, FormError, SubmitButton } from './AuthUI';
import { Field } from './Field';
import { NewPasswordFields } from './NewPasswordFields';
import { translateError } from './translateError';

type Result = 'signed-in' | 'registered';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isConfirmTouched, setIsConfirmTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

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
      setResult('signed-in');
    } catch {
      setResult('registered');
    } finally {
      setIsLoading(false);
    }
  }

  if (result === 'signed-in') {
    return (
      <AuthSuccess eyebrow="Готово" title="Аккаунт создан." href="/" actionLabel="На главную">
        Вы вошли как <span className="font-medium text-ink">{email}</span>. Можно приступать к
        заданиям.
      </AuthSuccess>
    );
  }

  if (result === 'registered') {
    return (
      <AuthSuccess eyebrow="Готово" title="Аккаунт создан." href="/login" actionLabel="Перейти ко входу">
        Теперь войдите с почтой <span className="font-medium text-ink">{email}</span>.
      </AuthSuccess>
    );
  }

  return (
    <div className="auth-enter">
      <AuthHeading index="02" eyebrow="Регистрация" title="Новый аккаунт">
        Нужны только почта и пароль. Новый аккаунт получает роль студента.
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
        <NewPasswordFields
          indexes={['02', '03']}
          password={password}
          confirm={confirm}
          isMismatch={isMismatch}
          onPasswordChange={setPassword}
          onConfirmChange={setConfirm}
          onConfirmBlur={() => setIsConfirmTouched(confirm.length > 0)}
        />

        {error && <FormError>{error}</FormError>}

        <SubmitButton isLoading={isLoading} label="Создать аккаунт" loadingLabel="Создаём аккаунт" />
      </form>

      <AuthSwitch question="Уже есть аккаунт?" href="/login" label="Войти" />
    </div>
  );
}
