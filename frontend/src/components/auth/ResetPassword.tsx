'use client';

import { resetPassword } from '@/api/auth/auth';
import { clearAccessToken } from '@/api/auth/token';
import { useEffect, useState } from 'react';
import {
  AuthHeading,
  AuthSuccess,
  AuthSwitch,
  FormError,
  LinkTokenNotice,
  SubmitButton,
} from './AuthUI';
import { Field } from './Field';
import { NewPasswordFields } from './NewPasswordFields';
import { translateError } from './translateError';

export default function ResetPassword({ initialToken }: { initialToken?: string }) {
  const [token, setToken] = useState(initialToken ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isConfirmTouched, setIsConfirmTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const hasLinkToken = Boolean(initialToken);
  const isMismatch = isConfirmTouched && confirm !== password;

  // Убираем токен из адресной строки, чтобы он не оставался в истории браузера
  useEffect(() => {
    if (initialToken) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [initialToken]);

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
      await resetPassword(token.trim(), password);
      // Бэкенд отзывает все токены после сброса — локальный тоже больше не действует
      clearAccessToken();
      setIsDone(true);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setIsLoading(false);
    }
  }

  if (isDone) {
    return (
      <AuthSuccess title="Пароль обновлён" href="/login" actionLabel="Войти">
        Все прежние сессии завершены. Войдите с новым паролем.
      </AuthSuccess>
    );
  }

  return (
    <div className="fade-in">
      <AuthHeading title="Задайте новый пароль">
        После сохранения все активные сессии будут завершены на всех устройствах.
      </AuthHeading>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {hasLinkToken ? (
          <LinkTokenNotice>Код сброса получен из ссылки</LinkTokenNotice>
        ) : (
          <Field
            label="Код из письма"
            name="token"
            autoComplete="one-time-code"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Вставьте код"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        )}

        <NewPasswordFields
          label="Новый пароль"
          password={password}
          confirm={confirm}
          isMismatch={isMismatch}
          onPasswordChange={setPassword}
          onConfirmChange={setConfirm}
          onConfirmBlur={() => setIsConfirmTouched(confirm.length > 0)}
        />

        {error && <FormError>{error}</FormError>}

        <div className="pt-2">
          <SubmitButton isLoading={isLoading} label="Сохранить пароль" loadingLabel="Сохраняем…" />
        </div>
      </form>

      <AuthSwitch question="Ссылка устарела?" href="/forgot-password" label="Запросить новую" />
    </div>
  );
}
