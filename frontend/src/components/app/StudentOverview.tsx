'use client';

import Link from 'next/link';
import { getMyAssignment, listMyAssignments, type StudentAssignmentDetail } from '@/api/assignments';
import { translateError } from '@/components/auth/translateError';
import { BUTTON_TEXT, MONO_LABEL } from '@/components/ui/styles';
import { useQuery } from '@/hooks/useQuery';
import {
  Empty,
  formatDate,
  Notice,
  plural,
  ProgressBar,
  Section,
  SkeletonRows,
  Stats,
  StatusTag,
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
      <Notice mark="signal">
        <span>{translateError(error)}</span>
        <button type="button" onClick={reload} className={BUTTON_TEXT}>
          Повторить →
        </button>
      </Notice>
    );
  }

  const assignments = data ?? [];
  const count = (...statuses: StudentAssignmentDetail['status'][]) =>
    data ? assignments.filter((item) => statuses.includes(item.status)).length : '—';
  const active = assignments.filter((item) => item.status !== 'completed');
  const done = assignments.filter((item) => item.status === 'completed');

  return (
    <div className="space-y-14">
      <Stats
        items={[
          { label: 'Всего', value: data ? assignments.length : '—' },
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
          <AssignmentList items={active} />
        )}
      </Section>

      {done.length > 0 && (
        <Section index="02" title="Завершённые" aside={String(done.length).padStart(2, '0')}>
          <AssignmentList items={done} />
        </Section>
      )}
    </div>
  );
}

function AssignmentList({ items }: { items: StudentAssignmentDetail[] }) {
  return (
    <ul>
      {items.map((item) => {
        const answered = item.tasks.filter((task) => task.submission_id !== null).length;
        const total = item.tasks.length;

        return (
          <li key={item.id} className="border-b border-ink/15">
            <Link
              href={`/dashboard/assignments/${item.id}`}
              className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 py-5 outline-none sm:grid-cols-[1fr_10rem_auto]"
            >
              <div className="min-w-0">
                <p className="truncate text-xl font-medium tracking-tight transition-colors group-hover:text-signal-deep group-focus-visible:text-signal-deep">
                  {item.title}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
                  <StatusTag status={item.status} />
                  <span className={`text-ink-soft ${MONO_LABEL}`}>
                    {total} {plural(total, 'задание', 'задания', 'заданий')}
                    {item.due_date && ` · до ${formatDate(item.due_date)}`}
                  </span>
                </div>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <ProgressBar value={answered} total={total} />
                <span className={`tabular-nums text-ink-soft ${MONO_LABEL}`}>
                  {answered}/{total}
                </span>
              </div>

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
