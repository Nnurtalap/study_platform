import type { ReactNode } from 'react';
import type { AssignmentStatus, TaskDifficulty } from '@/api/assignments';
import { CARD } from '@/components/ui/styles';

const TONES = {
  neutral: 'bg-line/60 text-ink-soft',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
} as const;

export type Tone = keyof typeof TONES;

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export const STATUS: Record<AssignmentStatus, { label: string; tone: Tone }> = {
  assigned: { label: 'Новое', tone: 'accent' },
  in_progress: { label: 'В работе', tone: 'warning' },
  completed: { label: 'Завершено', tone: 'success' },
  overdue: { label: 'Просрочено', tone: 'danger' },
};

export function StatusBadge({ status }: { status: AssignmentStatus }) {
  const { label, tone } = STATUS[status];
  return (
    <Badge tone={tone}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}

export const DIFFICULTY: Record<TaskDifficulty, string> = {
  easy: 'Лёгкое',
  medium: 'Среднее',
  hard: 'Сложное',
};

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink-soft">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="text-sm font-medium text-ink">{children}</h2>
      {aside && <span className="text-xs text-ink-soft">{aside}</span>}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={`${CARD} px-4 py-3.5`}>
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-ink">{value}</p>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
      <div
        aria-hidden
        className="mx-auto mb-4 grid size-10 place-items-center rounded-full bg-line/60 text-ink-soft"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 7h16M4 12h10M4 17h6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-ink">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">{children}</p>}
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-18 rounded-xl" />
      ))}
    </div>
  );
}

export function Notice({ tone = 'accent', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm ${TONES[tone]}`}
    >
      {children}
    </div>
  );
}

const DATE_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(value: string): string {
  return DATE_FORMAT.format(new Date(value));
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
