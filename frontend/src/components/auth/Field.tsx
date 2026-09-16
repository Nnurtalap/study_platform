'use client';

import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> & {
  index: string;
  label: string;
  hint?: ReactNode;
  invalid?: boolean;
};

export function Field({ index, label, hint, invalid, type = 'text', ...inputProps }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const [isRevealed, setIsRevealed] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label
          htmlFor={id}
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft"
        >
          <span className="mr-2 text-signal-deep">{index}</span>
          {label}
        </label>

        {isPassword && (
          <button
            type="button"
            onClick={() => setIsRevealed((value) => !value)}
            aria-controls={id}
            aria-pressed={isRevealed}
            className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:text-ink focus-visible:underline"
          >
            {isRevealed ? 'Скрыть' : 'Показать'}
          </button>
        )}
      </div>

      <div className="relative mt-1">
        <input
          {...inputProps}
          id={id}
          type={isPassword && isRevealed ? 'text' : type}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? hintId : undefined}
          className="peer block w-full rounded-none border-0 border-b-2 border-ink bg-transparent px-0 py-3 text-xl tracking-tight text-ink outline-none placeholder:text-ink/25 aria-invalid:border-signal"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-signal transition-transform duration-500 ease-swiss peer-focus:scale-x-100"
        />
      </div>

      {hint && (
        <div id={hintId} className="mt-3">
          {hint}
        </div>
      )}
    </div>
  );
}
