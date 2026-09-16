'use client';

import { listSubjects, listTasks } from '@/api/library';
import { translateError } from '@/components/auth/translateError';
import { BUTTON_SECONDARY, CARD } from '@/components/ui/styles';
import { useQuery } from '@/hooks/useQuery';
import { Badge, DIFFICULTY, EmptyState, Notice, SectionTitle, SkeletonList, Stat } from './ui';

async function loadLibrary() {
  const [subjects, tasks] = await Promise.all([listSubjects(), listTasks()]);
  return { subjects, tasks };
}

export default function TeacherOverview() {
  const { data, error, isLoading, reload } = useQuery('library', loadLibrary);

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

  const subjects = data?.subjects ?? [];
  const tasks = data?.tasks ?? [];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Предметов" value={data ? subjects.length : '—'} />
        <Stat label="Заданий в банке" value={data ? tasks.length : '—'} />
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
        <section>
          <SectionTitle>Предметы</SectionTitle>
          {isLoading && !data ? (
            <SkeletonList rows={2} />
          ) : subjects.length === 0 ? (
            <EmptyState title="Предметов пока нет" />
          ) : (
            <ul className={`${CARD} divide-y divide-line`}>
              {subjects.map((subject) => (
                <li key={subject.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="truncate text-sm font-medium text-ink">{subject.name}</span>
                  <span className="font-mono text-xs text-ink-soft">{subject.slug}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <SectionTitle>Банк заданий</SectionTitle>
          {isLoading && !data ? (
            <SkeletonList />
          ) : tasks.length === 0 ? (
            <EmptyState title="Заданий пока нет">
              Созданные вами задания появятся здесь — из них собираются тесты.
            </EmptyState>
          ) : (
            <ul className={`${CARD} divide-y divide-line`}>
              {tasks.map((task) => (
                <li key={task.id} className="px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-ink">{task.title}</p>
                    <Badge>{DIFFICULTY[task.difficulty]}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{task.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
