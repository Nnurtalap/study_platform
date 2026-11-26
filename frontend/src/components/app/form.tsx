'use client';

import {
  useId,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Field } from '@/components/auth/Field';
import Spinner from '@/components/ui/Spinner';
import { BUTTON_PRIMARY, MONO_LABEL } from '@/components/ui/styles';
import { Arrow } from './ui';

// Поля кабинета повторяют грамматику Field: моно-капс подпись с номером,
// подчёркнутый контрол, сигнальная линия на фокусе.
export { Field };

function Label({
  htmlFor,
  index,
  children,
}: {
  htmlFor: string;
  index: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={`${MONO_LABEL} text-ink-soft`}>
      <span className="mr-2 text-signal-deep">{index}</span>
      {children}
    </label>
  );
}

function FocusRule() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-signal transition-transform duration-500 ease-swiss peer-focus:scale-x-100"
    />
  );
}

function Hint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div id={id} className="mt-3">
      {children}
    </div>
  );
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className'> & {
  index: string;
  label: string;
  hint?: ReactNode;
  invalid?: boolean;
  placeholder?: string;
};

export function Select({
  index,
  label,
  hint,
  invalid,
  placeholder = '—',
  children,
  ...selectProps
}: SelectProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div>
      <Label htmlFor={id} index={index}>
        {label}
      </Label>

      <div className="relative mt-1">
        <select
          {...selectProps}
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? hintId : undefined}
          className="peer block w-full cursor-pointer appearance-none rounded-none border-0 border-b-2 border-ink bg-transparent px-0 py-3 pr-8 text-xl tracking-tight text-ink outline-none aria-invalid:border-signal disabled:cursor-not-allowed disabled:text-ink/40"
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
        <FocusRule />
        <svg
          aria-hidden
          width="14"
          height="8"
          viewBox="0 0 14 8"
          fill="none"
          className="pointer-events-none absolute right-0 bottom-4 text-ink-soft"
        >
          <path d="M1 1l6 6 6-6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      {hint && <Hint id={hintId}>{hint}</Hint>}
    </div>
  );
}

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'> & {
  index: string;
  label: string;
  hint?: ReactNode;
  invalid?: boolean;
};

export function Textarea({ index, label, hint, invalid, rows = 3, ...props }: TextareaProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div>
      <Label htmlFor={id} index={index}>
        {label}
      </Label>

      <div className="relative mt-1">
        <textarea
          {...props}
          id={id}
          rows={rows}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? hintId : undefined}
          className="peer block w-full resize-y rounded-none border-0 border-b-2 border-ink bg-transparent px-0 py-3 text-lg leading-relaxed text-ink outline-none placeholder:text-ink/25 aria-invalid:border-signal"
        />
        <FocusRule />
      </div>

      {hint && <Hint id={hintId}>{hint}</Hint>}
    </div>
  );
}

// Квадратный радиогруппный переключатель — круглых форм в системе нет
export function Choice<T extends string>({
  index,
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  index: string;
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const name = useId();

  return (
    <fieldset disabled={disabled}>
      <legend className={`${MONO_LABEL} text-ink-soft`}>
        <span className="mr-2 text-signal-deep">{index}</span>
        {label}
      </legend>

      <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 text-base has-disabled:cursor-not-allowed has-disabled:text-ink/40"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="size-3.5 cursor-pointer appearance-none rounded-none border-2 border-ink outline-none checked:bg-ink focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:border-ink/40"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// Главная кнопка форм кабинета: тот же блок, что в AnswerForm и CompleteBar
export function ActionButton({
  label,
  loadingLabel,
  isLoading,
  disabled,
  type = 'submit',
  onClick,
}: {
  label: string;
  loadingLabel: string;
  isLoading: boolean;
  disabled?: boolean;
  type?: 'submit' | 'button';
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      aria-busy={isLoading}
      className={BUTTON_PRIMARY}
    >
      <span className="font-medium">{isLoading ? loadingLabel : label}</span>
      {isLoading ? <Spinner className="bg-paper" /> : <Arrow />}
    </button>
  );
}
