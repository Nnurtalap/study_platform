'use client';

import Link from 'next/link';
import { getMyAssignment, listMyAssignments, type StudentAssignmentDetail } from '@/api/assignments';
import { translateError } from '@/components/auth/translateError';
import { BUTTON_SECONDARY, CARD } from '@/components/ui/styles';
import { useQuery } from '@/hooks/useQuery';
import {
  EmptyState,
  formatDate,
  Notice,
  plural,
  SectionTitle,
  SkeletonList,
  Stat,
  StatusBadge,
} from './ui';

// В списке нет названия теста и числа задач — дозапрашиваем карточки параллельно
async function loadAssignments(): Promise<StudentAssignmentDetail[]> {
  const list = await listMyAssignments();
  return Promise.all(list.map((item) => getMyAssignment(item.id)));
}

export default function StudentOverview() {
  const { data, error, isLoading, reload } = useQuery('my-assignments', loadAssignments);

  if (error) {
    return (
      <Notice tone="danger">
        <span>{translateError(error)}</span>
        <button type="button" onClick={reload} className={BUTTON_SECONDARY}>
          Повторить
        </button>
      </Notice>
    );
  }

  const assignments = data ?? [];
  const count = (status: StudentAssignmentDetail['status']) =>
    assignments.filter((item) => item.status === status).length;
  const active = assignments.filter((item) => item.status !== 'completed');
  const done = assignments.filter((item) => item.status === 'completed');

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Всего тестов" value={data ? assignments.length : '—'} />
        <Stat label="В работе" value={data ? count('in_progress') + count('assigned') : '—'} />
        <Stat label="Завершено" value={data ? count('completed') : '—'} />
        <Stat label="Просрочено" value={data ? count('overdue') : '—'} />
      </div>

      <section>
        <SectionTitle aside={data && active.length > 0 ? `${active.length}` : undefined}>
          Актуальные
        </SectionTitle>
        {isLoading && !data ? (
          <SkeletonList />
        ) : active.length === 0 ? (
          <EmptyState title="Новых тестов нет">
            Когда преподаватель назначит тест вам или вашей группе, он появится здесь.
          </EmptyState>
        ) : (
          <AssignmentList items={active} />
        )}
      </section>

      {done.length > 0 && (
        <section>
          <SectionTitle aside={`${done.length}`}>Завершённые</SectionTitle>
          <AssignmentList items={done} />
        </section>
      )}
    </div>
  );
}

function AssignmentList({ items }: { items: StudentAssignmentDetail[] }) {
  return (
    <ul className={`${CARD} divide-y divide-line overflow-hidden`}>
      {items.map((item) => {
        const answered = item.tasks.filter((task) => task.submission_id !== null).length;
        const total = item.tasks.length;

        return (
          <li key={item.id}>
            <Link
              href={`/dashboard/assignments/${item.id}`}
              className="group flex items-center gap-4 px-4 py-4 outline-none transition-colors hover:bg-line/30 focus-visible:bg-line/30 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-ink">{item.title}</p>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {total} {plural(total, 'задание', 'задания', 'заданий')}
                  {item.due_date && ` · до ${formatDate(item.due_date)}`}
                </p>
              </div>

              <div className="hidden w-32 shrink-0 sm:block">
                <div className="flex justify-between text-xs text-ink-soft">
                  <span>Прогресс</span>
                  <span className="tabular-nums">
                    {answered}/{total}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-ink"
                    style={{ width: total ? `${(answered / total) * 100}%` : 0 }}
                  />
                </div>
              </div>

              <span
                aria-hidden
                className="text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
              >
                →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
