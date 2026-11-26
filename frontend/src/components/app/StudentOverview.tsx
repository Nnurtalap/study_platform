'use client';

import Link from 'next/link';
import {
  getMyAssignment,
  listMyAssignments,
  type StudentAssignment,
  type StudentAssignmentDetail,
} from '@/api/assignments';
import { MONO_LABEL } from '@/components/ui/styles';
import { useQuery } from '@/hooks/useQuery';
import {
  Empty,
  formatDate,
  plural,
  ProgressBar,
  RetryNotice,
  Section,
  SkeletonRows,
  Stats,
  StatusTag,
} from './ui';

// Список не содержит названия теста и числа задач — дозапрашиваем карточки.
// allSettled, а не all: одна недоступная карточка не должна гасить весь список,
// в строке остаются статус и срок, которые уже пришли со списком.
type Row = { item: StudentAssignment; detail?: StudentAssignmentDetail };

async function loadAssignments(): Promise<Row[]> {
  const list = await listMyAssignments();
  const details = await Promise.allSettled(list.map((item) => getMyAssignment(item.id)));

  return list.map((item, i) => {
    const result = details[i];
    return result.status === 'fulfilled' ? { item, detail: result.value } : { item };
  });
}

export default function StudentOverview() {
  const { data, error, isLoading, reload } = useQuery('my-assignments', loadAssignments);

  // Ошибка без данных — единственный экран; ошибка поверх данных их не стирает
  if (error && !data) return <RetryNotice error={error} onRetry={reload} />;

  const rows = data ?? [];
  const count = (...statuses: StudentAssignment['status'][]) =>
    data ? rows.filter((row) => statuses.includes(row.item.status)).length : '—';
  const active = rows.filter((row) => row.item.status !== 'completed');
  const done = rows.filter((row) => row.item.status === 'completed');

  return (
    <div className="space-y-14">
      {error ? <RetryNotice error={error} onRetry={reload} /> : null}

      <Stats
        items={[
          { label: 'Всего', value: data ? rows.length : '—' },
          { label: 'В работе', value: count('assigned', 'in_progress') },
          { label: 'Завершено', value: count('completed') },
          { label: 'Просрочено', value: count('overdue') },
        ]}
      />

      <Section index="01" title="Актуальные" aside={data ? String(active.length).padStart(2, '0') : undefined}>
        {isLoading && !data ? (
          <SkeletonRows />
        ) : active.length === 0 ? (
          <Empty title="Новых тестов нет">
            Когда преподаватель назначит тест вам или вашей группе, он появится здесь.
          </Empty>
        ) : (
          <AssignmentList rows={active} />
        )}
      </Section>

      {done.length > 0 && (
        <Section index="02" title="Завершённые" aside={String(done.length).padStart(2, '0')}>
          <AssignmentList rows={done} />
        </Section>
      )}
    </div>
  );
}

function AssignmentList({ rows }: { rows: Row[] }) {
  return (
    <ul>
      {rows.map(({ item, detail }) => {
        const tasks = detail?.tasks;
        const answered = tasks?.filter((task) => task.submission_id !== null).length ?? 0;
        const total = tasks?.length ?? 0;
        const due = item.due_date && formatDate(item.due_date);

        return (
          <li key={item.id} className="border-b border-ink/15">
            <Link
              href={`/dashboard/assignments/${item.id}`}
              className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 py-5 outline-none sm:grid-cols-[1fr_10rem_auto]"
            >
              <div className="min-w-0">
                <p className="text-xl font-medium tracking-tight text-balance transition-colors sm:truncate group-hover:text-signal-deep group-focus-visible:text-signal-deep">
                  {detail?.title ?? `Тест № ${item.id}`}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
                  <StatusTag status={item.status} />
                  <span className={`text-ink-soft ${MONO_LABEL}`}>
                    {tasks
                      ? `${total} ${plural(total, 'задание', 'задания', 'заданий')}`
                      : 'Детали не загрузились'}
                    {due && ` · до ${due}`}
                  </span>
                </div>
              </div>

              {tasks ? (
                <div className="hidden items-center gap-3 sm:flex">
                  <ProgressBar value={answered} total={total} />
                  <span className={`tabular-nums text-ink-soft ${MONO_LABEL}`}>
                    {answered}/{total}
                  </span>
                </div>
              ) : (
                <span className="hidden sm:block" />
              )}

              <svg
                aria-hidden
                width="28"
                height="12"
                viewBox="0 0 28 12"
                fill="none"
                className="transition-transform duration-500 ease-swiss group-hover:translate-x-1.5"
              >
                <path d="M0 6h26M21 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
