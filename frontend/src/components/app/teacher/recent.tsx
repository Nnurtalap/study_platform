'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError } from '@/api/config';
import { translateError } from '@/components/auth/translateError';
import { BUTTON_TEXT, MONO_LABEL } from '@/components/ui/styles';
import { ActionButton, Field } from '../form';
import { Notice, Tag } from '../ui';

export type RecentEntry<T> = { id: number; data?: T; error?: unknown };

// allSettled, а не all: один забытый или чужой id не должен гасить весь список
export async function loadMany<T>(
  ids: number[],
  load: (id: number) => Promise<T>,
): Promise<RecentEntry<T>[]> {
  const results = await Promise.allSettled(ids.map(load));

  return ids.map((id, i) => {
    const result = results[i];
    return result.status === 'fulfilled'
      ? { id, data: result.value }
      : { id, error: result.reason };
  });
}

// 404/403 значат, что запись в индексе больше ни к чему не ведёт
export function isDeadEntry(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 403);
}

export function DeadRow({
  id,
  error,
  onForget,
}: {
  id: number;
  error: unknown;
  onForget: () => void;
}) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink/15 py-4">
      <div className="min-w-0">
        <p className="font-medium text-ink-soft">№ {id}</p>
        <p className="mt-1 text-sm text-ink-soft">{translateError(error)}</p>
      </div>
      {isDeadEntry(error) ? (
        <button type="button" onClick={onForget} className={BUTTON_TEXT}>
          Забыть →
        </button>
      ) : (
        <Tag mark="signal">Недоступно</Tag>
      )}
    </li>
  );
}

// Без этой формы преподаватель, сменивший браузер, теряет доступ к своим же тестам
export function OpenByIdForm({
  label,
  hrefPrefix,
  index = '01',
}: {
  label: string;
  hrefPrefix: string;
  index?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const id = Number(value);
  const isValid = Number.isInteger(id) && id > 0;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (isValid) router.push(`${hrefPrefix}/${id}`);
      }}
      className="flex flex-wrap items-end gap-x-8 gap-y-5"
    >
      <div className="min-w-48 flex-1">
        <Field
          index={index}
          label={label}
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          placeholder="например 12"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
      <ActionButton label="Открыть" loadingLabel="Открываем" isLoading={false} disabled={!isValid} />
    </form>
  );
}

export function StorageNotice() {
  return (
    <Notice mark="ochre">
      Список не сохраняется в этом браузере — открывайте разделы по номеру и сохраняйте ссылки.
    </Notice>
  );
}

export function RecentRow({
  href,
  title,
  aside,
  children,
}: {
  href: string;
  title: string;
  aside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <li className="border-b border-ink/15">
      <Link
        href={href}
        className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4 outline-none"
      >
        <div className="min-w-0">
          <p className="text-lg font-medium tracking-tight transition-colors group-hover:text-signal-deep group-focus-visible:text-signal-deep">
            {title}
          </p>
          {children && <p className="mt-1 text-sm text-ink-soft">{children}</p>}
        </div>
        {aside && <span className={`text-ink-soft ${MONO_LABEL}`}>{aside}</span>}
      </Link>
    </li>
  );
}
