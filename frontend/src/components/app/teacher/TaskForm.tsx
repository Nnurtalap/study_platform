'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { TaskDifficulty } from '@/api/assignments';
import { createTask, listSubjects, listTopics, type Task } from '@/api/library';
import { FormError, TextLink } from '@/components/auth/AuthUI';
import { MONO_LABEL } from '@/components/ui/styles';
import { useMutation } from '@/hooks/useMutation';
import { useQuery } from '@/hooks/useQuery';
import { ActionButton, Field, Select, Textarea } from '../form';
import { DIFFICULTY, Empty, Eyebrow, Notice, PageTitle, RetryNotice, Tag } from '../ui';

const DIFFICULTIES: TaskDifficulty[] = ['easy', 'medium', 'hard'];

export default function TaskForm() {
  const subjects = useQuery('subjects', listSubjects);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const topics = useQuery(subjectId === null ? null : `topics:${subjectId}`, () =>
    listTopics(subjectId!),
  );

  const [topicId, setTopicId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium');
  const [created, setCreated] = useState<Task | null>(null);

  const { run, isLoading, error } = useMutation(createTask);

  const subjectList = subjects.data ?? [];
  const topicList = topics.data ?? [];
  const isReady =
    topicId !== null && title.trim().length > 0 && body.trim().length > 0 && correctAnswer.trim().length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (topicId === null) return;

    const task = await run({
      title: title.trim(),
      body: body.trim(),
      correct_answer: correctAnswer.trim(),
      difficulty,
      topic_id: topicId,
    });
    if (!task) return;

    // Задание создано — поля освобождаем, тему оставляем для следующего
    setTitle('');
    setBody('');
    setCorrectAnswer('');
    setCreated(task);
  }

  return (
    <div className="auth-enter max-w-3xl space-y-12">
      <Link
        href="/library"
        className="group inline-flex items-baseline gap-2 text-sm font-medium outline-none hover:text-signal-deep focus-visible:text-signal-deep"
      >
        <span aria-hidden className="transition-transform duration-500 ease-swiss group-hover:-translate-x-1">
          ←
        </span>
        Библиотека
      </Link>

      <header>
        <Eyebrow>01 / Новое задание</Eyebrow>
        <PageTitle>
          Задание<span className="text-signal">.</span>
        </PageTitle>
        <p className="mt-5 text-base leading-relaxed text-ink-soft">
          Студент отвечает свободным текстом — проверяется формулировка и верный ответ.
          Изменить или удалить задание потом нельзя.
        </p>
      </header>

      {created && (
        <Notice mark="ink">
          <span>
            Задание № {created.id} создано: {created.title}
          </span>
          <TextLink href="/library">В библиотеку →</TextLink>
        </Notice>
      )}

      {subjects.error && !subjects.data ? (
        <RetryNotice error={subjects.error} onRetry={subjects.reload} />
      ) : subjectList.length === 0 && !subjects.isLoading ? (
        <Empty title="Сначала нужен предмет и тема">
          Задание создаётся внутри темы. <TextLink href="/library">Создать предмет →</TextLink>
        </Empty>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-9">
          <Select
            index="01"
            label="Предмет"
            required
            value={subjectId ?? ''}
            disabled={subjects.isLoading && !subjects.data}
            onChange={(event) => {
              setSubjectId(event.target.value ? Number(event.target.value) : null);
              setTopicId(null);
            }}
          >
            {subjectList.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>

          <Select
            index="02"
            label="Тема"
            required
            value={topicId ?? ''}
            disabled={subjectId === null || (topics.isLoading && !topics.data)}
            placeholder={subjectId === null ? 'Сначала выберите предмет' : '—'}
            onChange={(event) => setTopicId(event.target.value ? Number(event.target.value) : null)}
            hint={
              subjectId !== null && topicList.length === 0 && !topics.isLoading ? (
                <p className={`${MONO_LABEL} text-signal-deep`}>
                  В предмете нет тем — добавьте её в библиотеке
                </p>
              ) : undefined
            }
          >
            {topicList.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </Select>

          <Field
            index="03"
            label="Заголовок"
            placeholder="Дискриминант"
            required
            maxLength={200}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <Textarea
            index="04"
            label="Формулировка"
            rows={5}
            placeholder="Текст задания, который увидит студент…"
            required
            maxLength={5000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />

          <Textarea
            index="05"
            label="Верный ответ"
            rows={3}
            placeholder="Эталонный ответ — студент его не видит"
            required
            maxLength={5000}
            value={correctAnswer}
            onChange={(event) => setCorrectAnswer(event.target.value)}
          />

          <Select
            index="06"
            label="Сложность"
            required
            value={difficulty}
            placeholder="—"
            onChange={(event) => setDifficulty(event.target.value as TaskDifficulty)}
          >
            {DIFFICULTIES.map((value) => (
              <option key={value} value={value}>
                {DIFFICULTY[value]}
              </option>
            ))}
          </Select>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/15 pt-6">
            <Tag mark="soft">Тип ответа: свободный текст</Tag>
            <ActionButton
              label="Создать задание"
              loadingLabel="Создаём"
              isLoading={isLoading}
              disabled={!isReady}
            />
          </div>

          {error && <FormError>{error}</FormError>}
        </form>
      )}
    </div>
  );
}
