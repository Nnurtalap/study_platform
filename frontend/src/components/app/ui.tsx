'use client';

import type { ReactNode } from 'react';
import type { AssignmentStatus, TaskDifficulty } from '@/api/assignments';
import { translateError } from '@/components/auth/translateError';
import { BUTTON_TEXT, MONO_LABEL } from '@/components/ui/styles';

// Цвет маркера — единственное, что отличает статусы; форма везде одна: квадрат
const MARKS = {
  ink: 'bg-ink',
  soft: 'bg-ink/25',
  signal: 'bg-signal',
  cobalt: 'bg-cobalt',
  ochre: 'bg-ochre',
} as const;

export type Mark = keyof typeof MARKS;

export function Tag({ mark = 'soft', children }: { mark?: Mark; children: ReactNode }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-2 text-ink-soft ${MONO_LABEL}`}>
      <span aria-hidden className={`size-2 ${MARKS[mark]}`} />
      {children}
    </span>
  );
}

export const STATUS: Record<AssignmentStatus, { label: string; mark: Mark }> = {
  assigned: { label: 'Новое', mark: 'cobalt' },
  in_progress: { label: 'В работе', mark: 'ochre' },
  completed: { label: 'Завершено', mark: 'ink' },
  overdue: { label: 'Просрочено', mark: 'signal' },
};

export function StatusTag({ status }: { status: AssignmentStatus }) {
  const { label, mark } = STATUS[status];
  return <Tag mark={mark}>{label}</Tag>;
}

export const DIFFICULTY: Record<TaskDifficulty, string> = {
  easy: 'Лёгкое',
  medium: 'Среднее',
  hard: 'Сложное',
};

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className={`flex items-center gap-3 text-ink-soft ${MONO_LABEL}`}>
      <span aria-hidden className="size-2 bg-signal" />
      {children}
    </p>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="mt-5 text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] font-semibold tracking-[-0.045em] text-balance">
      {children}
    </h1>
  );
}

export function Section({
  index,
  title,
  aside,
  children,
}: {
  index: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="relative flex items-baseline justify-between gap-4 border-t-2 border-ink pt-3 pb-5">
        <span aria-hidden className="absolute -top-0.5 left-0 h-0.5 w-6 bg-signal" />
        <h2 className="flex items-baseline gap-3">
          <span className={`text-ink-soft ${MONO_LABEL}`}>{index}</span>
          <span className="text-sm font-medium">{title}</span>
        </h2>
        {aside && <span className={`text-ink-soft ${MONO_LABEL}`}>{aside}</span>}
      </div>
      {children}
    </section>
  );
}

export function Stats({ items }: { items: { label: string; value: number | string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:gap-x-12">
      {items.map((item) => (
        <div key={item.label} className="border-t border-ink/15 pt-3">
          <dt className={`text-ink-soft ${MONO_LABEL}`}>{item.label}</dt>
          <dd className="mt-2 text-5xl font-semibold tracking-[-0.04em] tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex items-start gap-5 border-b border-ink/15 pb-8">
      <span aria-hidden className="mt-1 size-5 shrink-0 rounded-full border border-dashed border-ink/40" />
      <div>
        <p className="font-medium">{title}</p>
        {children && <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-soft">{children}</p>}
      </div>
    </div>
  );
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-16" />
      ))}
    </div>
  );
}

export function Notice({ mark = 'cobalt', children }: { mark?: Mark; children: ReactNode }) {
  const border = { ink: 'border-ink', soft: 'border-ink/25', signal: 'border-signal', cobalt: 'border-cobalt', ochre: 'border-ochre' }[mark];
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-l-4 bg-ink/[0.04] px-4 py-3 text-sm ${border}`}
    >
      {children}
    </div>
  );
}

// Ошибка, которая НЕ стирает уже показанные данные: упавшее фоновое обновление
// должно оставлять страницу на месте и предлагать повторить запрос.
export function RetryNotice({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Notice mark="signal">
      <span role="alert">{translateError(error)}</span>
      <button type="button" onClick={onRetry} className={BUTTON_TEXT}>
        Повторить →
      </button>
    </Notice>
  );
}

export function ProgressBar({ value, total }: { value: number; total: number }) {
  return (
    <div aria-hidden className="grid h-1.5 flex-1 gap-[3px]" style={{ gridTemplateColumns: `repeat(${Math.max(total, 1)}, 1fr)` }}>
      {Array.from({ length: Math.max(total, 1) }, (_, i) => (
        <span key={i} className={i < value ? 'bg-ink' : 'bg-ink/10'} />
      ))}
    </div>
  );
}

export function Arrow() {
  return (
    <svg
      aria-hidden
      width="28"
      height="12"
      viewBox="0 0 28 12"
      fill="none"
      className="transition-transform duration-500 ease-swiss group-enabled:group-hover:translate-x-1.5"
    >
      <path d="M0 6h26M21 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const DATE_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

// Intl бросает RangeError на нечисловой дате, а error boundary выше её не ждёт —
// поэтому непарсящееся значение показываем как отсутствующее.
export function formatDate(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return DATE_FORMAT.format(date);
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
