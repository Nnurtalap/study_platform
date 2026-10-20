'use client';

import { listSubjects, listTasks } from '@/api/library';
import { TextLink } from '@/components/auth/AuthUI';
import { MONO_LABEL } from '@/components/ui/styles';
import { useQuery } from '@/hooks/useQuery';
import { DIFFICULTY, Empty, RetryNotice, Section, SkeletonRows, Stats, Tag } from './ui';

async function loadLibrary() {
  const [subjects, tasks] = await Promise.all([listSubjects(), listTasks()]);
  return { subjects, tasks };
}

const DIFFICULTY_MARK = { easy: 'cobalt', medium: 'ochre', hard: 'signal' } as const;

const SECTIONS = [
  {
    href: '/library',
    label: 'Библиотека',
    text: 'Предметы, темы и банк заданий. Здесь создаётся всё содержимое.',
  },
  {
    href: '/tests',
    label: 'Тесты',
    text: 'Собрать тест из заданий, задать позиции и баллы, назначить.',
  },
  {
    href: '/groups',
    label: 'Группы',
    text: 'Списки студентов, которым тест назначается одним действием.',
  },
];

export default function TeacherOverview() {
  const { data, error, isLoading, reload } = useQuery('library', loadLibrary);

  // Ошибка поверх уже загруженной библиотеки не должна её стирать
  if (error && !data) return <RetryNotice error={error} onRetry={reload} />;

  const subjects = data?.subjects ?? [];
  const tasks = data?.tasks ?? [];
  const recentTasks = [...tasks].reverse().slice(0, 5);

  return (
    <div className="space-y-14">
      {error ? <RetryNotice error={error} onRetry={reload} /> : null}

      <Stats
        items={[
          { label: 'Предметов', value: data ? subjects.length : '—' },
          { label: 'Заданий в банке', value: data ? tasks.length : '—' },
        ]}
      />

      <Section index="01" title="Разделы">
        <ul className="grid gap-x-12 gap-y-8 sm:grid-cols-3">
          {SECTIONS.map((section, i) => (
            <li key={section.href} className="border-t border-ink/15 pt-3">
              <p className={`text-ink-soft ${MONO_LABEL}`}>{String(i + 1).padStart(2, '0')}</p>
              <p className="mt-2 text-xl font-medium tracking-tight">
                <TextLink href={section.href}>{section.label} →</TextLink>
              </p>
              <p className="mt-2 max-w-[18rem] text-sm leading-relaxed text-ink-soft">
                {section.text}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        index="02"
        title="Недавние задания"
        aside={data ? String(tasks.length).padStart(2, '0') : undefined}
      >
        {isLoading && !data ? (
          <SkeletonRows />
        ) : recentTasks.length === 0 ? (
          <Empty title="Заданий пока нет">
            Создайте предмет и тему, затем первое задание.{' '}
            <TextLink href="/library">В библиотеку →</TextLink>
          </Empty>
        ) : (
          <>
            <ul>
              {recentTasks.map((task) => (
                <li key={task.id} className="border-b border-ink/15 py-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="min-w-0 truncate font-medium">{task.title}</p>
                    <Tag mark={DIFFICULTY_MARK[task.difficulty]}>{DIFFICULTY[task.difficulty]}</Tag>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{task.body}</p>
                </li>
              ))}
            </ul>
            {tasks.length > recentTasks.length && (
              <p className="mt-5">
                <TextLink href="/library">Весь банк заданий →</TextLink>
              </p>
            )}
          </>
        )}
      </Section>
    </div>
  );
}
