'use client';

import { requestVerifyToken, verifyEmail } from '@/api/auth/auth';
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
import { getErrorCode, translateError } from './translateError';

type Mode = 'request' | 'confirm';
type Result = 'requested' | 'verified' | 'already-verified';

export default function VerifyEmail({ initialToken }: { initialToken?: string }) {
  const [mode, setMode] = useState<Mode>(initialToken ? 'confirm' : 'request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(initialToken ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const hasLinkToken = Boolean(initialToken);

  // Убираем токен из адресной строки, чтобы он не оставался в истории браузера
  useEffect(() => {
    if (initialToken) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [initialToken]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setResult(null);
  }

  async function handleRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await requestVerifyToken(email);
      setResult('requested');
    } catch (err) {
      setError(translateError(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await verifyEmail(token.trim());
      setResult('verified');
    } catch (err) {
      if (getErrorCode(err) === 'VERIFY_USER_ALREADY_VERIFIED') {
        setResult('already-verified');
      } else {
        setError(translateError(err));
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (result === 'requested') {
    return (
      <AuthSuccess
        title="Проверьте почту"
        href="/login"
        actionLabel="Ко входу"
        footer={
          <AuthSwitch
            question="Уже есть код из письма?"
            label="Ввести код"
            onClick={() => switchMode('confirm')}
          />
        }
      >
        Если аккаунт <span className="font-medium text-ink">{email}</span> существует и ещё не
        подтверждён, на него придёт ссылка. Она действует один час.
      </AuthSuccess>
    );
  }

  if (result === 'verified' || result === 'already-verified') {
    const isFresh = result === 'verified';

    return (
      <AuthSuccess
        title={isFresh ? 'Почта подтверждена' : 'Почта уже подтверждена'}
        href="/login"
        actionLabel="Войти"
      >
        {isFresh
          ? 'Адрес подтверждён — аккаунт полностью готов к работе.'
          : 'Повторно ничего делать не нужно — можно сразу войти.'}
      </AuthSuccess>
    );
  }

  if (mode === 'request') {
    return (
      <div key="request" className="fade-in">
        <AuthHeading title="Подтвердите почту">
          Укажите адрес, использованный при регистрации, — пришлём ссылку для подтверждения.
        </AuthHeading>

        <form onSubmit={handleRequest} className="mt-6 space-y-4">
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

          {error && <FormError>{error}</FormError>}

          <div className="pt-2">
            <SubmitButton isLoading={isLoading} label="Отправить ссылку" loadingLabel="Отправляем…" />
          </div>
        </form>

        <AuthSwitch
          question="Уже есть код из письма?"
          label="Ввести код"
          onClick={() => switchMode('confirm')}
        />
      </div>
    );
  }

  return (
    <div key="confirm" className="fade-in">
      <AuthHeading title="Подтвердите почту">
        {hasLinkToken
          ? 'Осталось нажать кнопку — и адрес будет подтверждён.'
          : 'Вставьте код из письма, чтобы подтвердить адрес.'}
      </AuthHeading>

      <form onSubmit={handleConfirm} className="mt-6 space-y-4">
        {hasLinkToken ? (
          <LinkTokenNotice>Код подтверждения получен из ссылки</LinkTokenNotice>
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

        {error && <FormError>{error}</FormError>}

        <div className="pt-2">
          <SubmitButton isLoading={isLoading} label="Подтвердить почту" loadingLabel="Проверяем…" />
        </div>
      </form>

      <AuthSwitch
        question="Нет кода или он устарел?"
        label="Запросить новый"
        onClick={() => switchMode('request')}
      />
    </div>
  );
}
