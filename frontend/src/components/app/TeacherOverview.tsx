'use client';

import { listSubjects, listTasks } from '@/api/library';
import { translateError } from '@/components/auth/translateError';
import { BUTTON_TEXT, MONO_LABEL } from '@/components/ui/styles';
import { useQuery } from '@/hooks/useQuery';
import { DIFFICULTY, Empty, Notice, Section, SkeletonRows, Stats, Tag } from './ui';

async function loadLibrary() {
  const [subjects, tasks] = await Promise.all([listSubjects(), listTasks()]);
  return { subjects, tasks };
}

const DIFFICULTY_MARK = { easy: 'cobalt', medium: 'ochre', hard: 'signal' } as const;

export default function TeacherOverview() {
  const { data, error, isLoading, reload } = useQuery('library', loadLibrary);

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

  const subjects = data?.subjects ?? [];
  const tasks = data?.tasks ?? [];

  return (
    <div className="space-y-14">
      <Stats
        items={[
          { label: 'Предметов', value: data ? subjects.length : '—' },
          { label: 'Заданий в банке', value: data ? tasks.length : '—' },
        ]}
      />

      <div className="grid gap-14 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-4">
          <Section index="01" title="Предметы">
            {isLoading && !data ? (
              <SkeletonRows rows={2} />
            ) : subjects.length === 0 ? (
              <Empty title="Предметов пока нет" />
            ) : (
              <ul>
                {subjects.map((subject) => (
                  <li
                    key={subject.id}
                    className="flex items-baseline justify-between gap-4 border-b border-ink/15 py-3"
                  >
                    <span className="truncate font-medium">{subject.name}</span>
                    <span className={`text-ink-soft ${MONO_LABEL}`}>{subject.slug}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="lg:col-span-8">
          <Section index="02" title="Банк заданий">
            {isLoading && !data ? (
              <SkeletonRows />
            ) : tasks.length === 0 ? (
              <Empty title="Заданий пока нет">
                Созданные вами задания появятся здесь — из них собираются тесты.
              </Empty>
            ) : (
              <ul>
                {tasks.map((task) => (
                  <li key={task.id} className="border-b border-ink/15 py-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="truncate font-medium">{task.title}</p>
                      <Tag mark={DIFFICULTY_MARK[task.difficulty]}>{DIFFICULTY[task.difficulty]}</Tag>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{task.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
