'use client';

import { Field } from './Field';

// Совпадает с UserManager.validate_password на бэкенде
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

function PasswordRuler({ length }: { length: number }) {
  const filled = Math.min(length, MIN_PASSWORD_LENGTH);
  const isEnough = length >= MIN_PASSWORD_LENGTH;

  return (
    <div className="flex items-center gap-3">
      <div aria-hidden className="h-1 flex-1 overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-300 ${
            isEnough ? 'bg-success' : 'bg-accent'
          }`}
          style={{ width: `${(filled / MIN_PASSWORD_LENGTH) * 100}%` }}
        />
      </div>
      <span className="min-w-20 text-right text-xs tabular-nums text-ink-soft">
        <span className="sr-only">Минимум {MIN_PASSWORD_LENGTH} символов. </span>
        {isEnough ? 'Достаточно' : `${length} / ${MIN_PASSWORD_LENGTH}`}
      </span>
    </div>
  );
}

export function NewPasswordFields({
  label = 'Пароль',
  password,
  confirm,
  isMismatch,
  onPasswordChange,
  onConfirmChange,
  onConfirmBlur,
}: {
  label?: string;
  password: string;
  confirm: string;
  isMismatch: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  onConfirmBlur: () => void;
}) {
  return (
    <>
      <Field
        label={label}
        type="password"
        name="password"
        autoComplete="new-password"
        placeholder="Минимум 12 символов"
        required
        minLength={MIN_PASSWORD_LENGTH}
        maxLength={MAX_PASSWORD_LENGTH}
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        hint={<PasswordRuler length={password.length} />}
      />
      <Field
        label="Повторите пароль"
        type="password"
        name="password-confirm"
        autoComplete="new-password"
        placeholder="••••••••••••"
        required
        value={confirm}
        onChange={(e) => onConfirmChange(e.target.value)}
        onBlur={onConfirmBlur}
        invalid={isMismatch}
        hint={
          isMismatch ? (
            <p className="text-xs text-danger">
              Пароли не совпадают
            </p>
          ) : undefined
        }
      />
    </>
  );
}
