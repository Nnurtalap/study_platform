'use client';

import { Field } from './Field';

// Совпадает с UserManager.validate_password на бэкенде
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

function PasswordRuler({ length }: { length: number }) {
  const filled = Math.min(length, MIN_PASSWORD_LENGTH);
  const isEnough = length >= MIN_PASSWORD_LENGTH;

  return (
    <div className="flex items-center gap-4">
      <div aria-hidden className="grid flex-1 grid-cols-12 gap-[3px]">
        {Array.from({ length: MIN_PASSWORD_LENGTH }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 transition-colors duration-300 ${
              i < filled ? (isEnough ? 'bg-ink' : 'bg-signal') : 'bg-ink/10'
            }`}
          />
        ))}
      </div>
      <span className="min-w-20 text-right font-mono text-[11px] uppercase tracking-[0.12em] tabular-nums text-ink-soft">
        <span className="sr-only">Минимум {MIN_PASSWORD_LENGTH} символов. </span>
        {isEnough ? 'Достаточно' : `${length} / ${MIN_PASSWORD_LENGTH}`}
      </span>
    </div>
  );
}

export function NewPasswordFields({
  indexes,
  label = 'Пароль',
  password,
  confirm,
  isMismatch,
  onPasswordChange,
  onConfirmChange,
  onConfirmBlur,
}: {
  indexes: [string, string];
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
        index={indexes[0]}
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
        index={indexes[1]}
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
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-signal-deep">
              Пароли не совпадают
            </p>
          ) : undefined
        }
      />
    </>
  );
}
