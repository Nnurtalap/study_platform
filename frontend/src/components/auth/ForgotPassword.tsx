'use client';

import { forgotPassword } from '@/api/auth/auth';
import { useState } from 'react';
import { AuthHeading, AuthSuccess, AuthSwitch, FormError, SubmitButton } from './AuthUI';
import { Field } from './Field';
import { translateError } from './translateError';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setIsDone(true);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setIsLoading(false);
    }
  }

  if (isDone) {
    return (
      <AuthSuccess
        eyebrow="Запрос принят"
        title="Проверьте почту."
        href="/login"
        actionLabel="Вернуться ко входу"
        footer={<AuthSwitch question="Уже есть код из письма?" href="/reset-password" label="Ввести код" />}
      >
        Если аккаунт <span className="font-medium text-ink">{email}</span> существует, на него
        придёт ссылка для сброса пароля. Она действует один час.
      </AuthSuccess>
    );
  }

  return (
    <div className="auth-enter">
      <AuthHeading index="03" eyebrow="Восстановление" title="Забыли пароль?">
        Укажите почту аккаунта — пришлём ссылку, по которой можно задать новый пароль.
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

        {error && <FormError>{error}</FormError>}

        <SubmitButton isLoading={isLoading} label="Отправить ссылку" loadingLabel="Отправляем" />
      </form>

      <AuthSwitch question="Вспомнили пароль?" href="/login" label="Войти" />
    </div>
  );
}
