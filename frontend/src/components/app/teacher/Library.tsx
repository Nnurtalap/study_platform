'use client';

import Link from 'next/link';
import { useState } from 'react';
import { listSubjects, listTasks, listTopics } from '@/api/library';
import { TextLink } from '@/components/auth/AuthUI';
import { MONO_LABEL } from '@/components/ui/styles';
import { useQuery } from '@/hooks/useQuery';
import {
  DIFFICULTY,
  Empty,
  Eyebrow,
  PageTitle,
  RetryNotice,
  Section,
  SkeletonRows,
  Tag,
} from '../ui';
import SubjectForm from './SubjectForm';
import TopicForm from './TopicForm';

const DIFFICULTY_MARK = { easy: 'cobalt', medium: 'ochre', hard: 'signal' } as const;

export default function Library() {
  // Выбор живёт в состоянии, а не в URL: глубокая ссылка на колонку ничего не даёт
  const [pickedSubject, setPickedSubject] = useState<number | null>(null);
  const [pickedTopic, setPickedTopic] = useState<number | null>(null);

  const subjects = useQuery('subjects', listSubjects);
  const subjectList = subjects.data ?? [];
  const subjectId = pickedSubject ?? subjectList[0]?.id ?? null;

  const topics = useQuery(subjectId === null ? null : `topics:${subjectId}`, () =>
    listTopics(subjectId!),
  );
  const topicList = topics.data ?? [];
  // Выбранная тема могла остаться от другого предмета — проверяем принадлежность
  const topicId = topicList.some((topic) => topic.id === pickedTopic) ? pickedTopic : null;

  const tasks = useQuery(`tasks:${topicId ?? 'all'}`, () => listTasks(topicId ?? undefined));
  const taskList = tasks.data ?? [];

  function selectSubject(id: number) {
    setPickedSubject(id);
    setPickedTopic(null);
  }

  return (
    <div className="auth-enter space-y-14">
      <header>
        <Eyebrow>01 / Библиотека</Eyebrow>
        <PageTitle>
          Предметы и задания<span className="text-signal">.</span>
        </PageTitle>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
          Задания живут внутри тем, темы — внутри предметов. Из заданий собираются тесты.
          Банк заданий личный: видны только созданные вами.
        </p>
      </header>

      {subjects.error ? <RetryNotice error={subjects.error} onRetry={subjects.reload} /> : null}

      <div className="grid gap-14 lg:grid-cols-12 lg:gap-x-12">
        <div className="space-y-8 lg:col-span-4">
          <Section
            index="01"
            title="Предметы"
            aside={subjects.data ? String(subjectList.length).padStart(2, '0') : undefined}
          >
            {subjects.isLoading && !subjects.data ? (
              <SkeletonRows rows={2} />
            ) : subjectList.length === 0 ? (
              <Empty title="Предметов пока нет">Создайте первый — ниже.</Empty>
            ) : (
              <ul>
                {subjectList.map((subject) => {
                  const isActive = subject.id === subjectId;
                  return (
                    <li key={subject.id} className="border-b border-ink/15">
                      <button
                        type="button"
                        onClick={() => selectSubject(subject.id)}
                        aria-pressed={isActive}
                        className="group flex w-full cursor-pointer items-baseline justify-between gap-4 py-3 text-left outline-none"
                      >
                        <span
                          className={`truncate font-medium transition-colors ${
                            isActive
                              ? 'text-ink'
                              : 'text-ink-soft group-hover:text-ink group-focus-visible:text-signal-deep'
                          }`}
                        >
                          {subject.name}
                        </span>
                        <span className={`shrink-0 text-ink-soft ${MONO_LABEL}`}>{subject.slug}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <div className="border-t border-ink/15 pt-6">
            <SubjectForm onCreated={(subject) => { selectSubject(subject.id); subjects.reload(); }} />
          </div>
        </div>

        <div className="space-y-8 lg:col-span-4">
          <Section
            index="02"
            title="Темы"
            aside={subjectId === null ? undefined : String(topicList.length).padStart(2, '0')}
          >
            {subjectId === null ? (
              <Empty title="Сначала выберите предмет" />
            ) : topics.error && !topics.data ? (
              <RetryNotice error={topics.error} onRetry={topics.reload} />
            ) : topics.isLoading && !topics.data ? (
              <SkeletonRows rows={2} />
            ) : topicList.length === 0 ? (
              <Empty title="Тем пока нет">В этом предмете ещё нет тем.</Empty>
            ) : (
              <ul>
                <li className="border-b border-ink/15">
                  <button
                    type="button"
                    onClick={() => setPickedTopic(null)}
                    aria-pressed={topicId === null}
                    className={`w-full cursor-pointer py-3 text-left outline-none ${MONO_LABEL} ${
                      topicId === null ? 'text-ink' : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    Все темы
                  </button>
                </li>
                {topicList.map((topic) => {
                  const isActive = topic.id === topicId;
                  return (
                    <li key={topic.id} className="border-b border-ink/15">
                      <button
                        type="button"
                        onClick={() => setPickedTopic(topic.id)}
                        aria-pressed={isActive}
                        className={`group flex w-full cursor-pointer items-baseline gap-3 py-3 text-left outline-none transition-colors ${
                          isActive ? 'text-ink' : 'text-ink-soft hover:text-ink'
                        }`}
                      >
                        <span className="truncate font-medium">{topic.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          {subjectId !== null && (
            <div className="border-t border-ink/15 pt-6">
              <TopicForm
                subjectId={subjectId}
                onCreated={(topic) => { setPickedTopic(topic.id); topics.reload(); }}
              />
            </div>
          )}
        </div>

        <div className="space-y-8 lg:col-span-4">
          <Section
            index="03"
            title="Банк заданий"
            aside={tasks.data ? String(taskList.length).padStart(2, '0') : undefined}
          >
            {tasks.error && !tasks.data ? (
              <RetryNotice error={tasks.error} onRetry={tasks.reload} />
            ) : tasks.isLoading && !tasks.data ? (
              <SkeletonRows />
            ) : taskList.length === 0 ? (
              <Empty title="Заданий пока нет">
                {topicId === null
                  ? 'Создайте первое задание — из них собираются тесты.'
                  : 'В этой теме ещё нет ваших заданий.'}
              </Empty>
            ) : (
              <ul>
                {taskList.map((task) => (
                  <li key={task.id} className="border-b border-ink/15 py-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="truncate font-medium">{task.title}</p>
                      <Tag mark={DIFFICULTY_MARK[task.difficulty]}>{DIFFICULTY[task.difficulty]}</Tag>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{task.body}</p>
                    <p className={`mt-2 text-ink-soft ${MONO_LABEL}`}>№ {task.id}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <div className="border-t border-ink/15 pt-6">
            <p className="text-sm text-ink-soft">
              Задание создаётся на отдельной странице — нужны формулировка и верный ответ.
            </p>
            <p className="mt-3">
              <TextLink href="/library/tasks/new">Новое задание →</TextLink>
            </p>
          </div>
        </div>
      </div>

      <Section index="04" title="Дальше">
        <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
          Когда задания готовы, соберите из них тест и назначьте его группе или студенту:{' '}
          <Link href="/tests" className="font-medium text-ink underline decoration-signal decoration-2 underline-offset-[6px]">
            Тесты
          </Link>{' '}
          и{' '}
          <Link href="/groups" className="font-medium text-ink underline decoration-signal decoration-2 underline-offset-[6px]">
            Группы
          </Link>
          .
        </p>
      </Section>
    </div>
  );
}
