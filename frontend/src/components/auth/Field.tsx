'use client';

import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { INPUT } from '@/components/ui/styles';

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> & {
  label: string;
  labelAction?: ReactNode;
  hint?: ReactNode;
  invalid?: boolean;
};

export function Field({ label, labelAction, hint, invalid, type = 'text', ...inputProps }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const [isRevealed, setIsRevealed] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {labelAction}
      </div>

      <div className="relative">
        <input
          {...inputProps}
          id={id}
          type={isPassword && isRevealed ? 'text' : type}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? hintId : undefined}
          className={`${INPUT} h-10 ${isPassword ? 'pr-20' : ''}`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setIsRevealed((value) => !value)}
            aria-controls={id}
            aria-pressed={isRevealed}
            className="absolute inset-y-1 right-1 cursor-pointer rounded-md px-2.5 text-xs font-medium text-ink-soft outline-none hover:bg-line/60 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
          >
            {isRevealed ? 'Скрыть' : 'Показать'}
          </button>
        )}
      </div>

      {hint && (
        <div id={hintId} className="mt-2">
          {hint}
        </div>
      )}
    </div>
  );
}
