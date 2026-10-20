'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiError } from '@/api/config';
import { listTasks, type Task } from '@/api/library';
import { getTest, type Test } from '@/api/tests';
import { TextLink } from '@/components/auth/AuthUI';
import { MONO_LABEL } from '@/components/ui/styles';
import { useQuery } from '@/hooks/useQuery';
import { useRecentIds } from '@/hooks/useRecentIds';
import {
  DIFFICULTY,
  Empty,
  Eyebrow,
  Notice,
  PageTitle,
  plural,
  RetryNotice,
  Section,
  SkeletonRows,
  Tag,
} from '../ui';
import { AssignTestForm } from './AssignForm';
import TestTaskForm from './TestTaskForm';

// Состав теста приходит без названий — склеиваем их из банка заданий одним запросом
async function loadTest(id: number): Promise<{ test: Test; bank: Task[] }> {
  const [test, bank] = await Promise.all([getTest(id), listTasks()]);
  return { test, bank };
}

export default function TestView({ id }: { id: number | null }) {
  const { data, error, isLoading, reload } = useQuery(id === null ? null : `test:${id}`, () =>
    loadTest(id!),
  );
  const { remember } = useRecentIds('tests');
  const [isLocked, setIsLocked] = useState(false);

  // Открытие по номеру наполняет индекс: тест существует и принадлежит вам
  useEffect(() => {
    if (data) remember(data.test.id);
  }, [data, remember]);

  const isNotFound = id === null || (error instanceof ApiError && error.status === 404);

  return (
    <div className="auth-enter space-y-12">
      <Link
        href="/tests"
        className="group inline-flex items-baseline gap-2 text-sm font-medium outline-none hover:text-signal-deep focus-visible:text-signal-deep"
      >
        <span aria-hidden className="transition-transform duration-500 ease-swiss group-hover:-translate-x-1">
          ←
        </span>
        Все тесты
      </Link>

      {isNotFound ? (
        <Empty title="Тест не найден">
          Возможно, номер неверен или тест создан другим преподавателем.{' '}
          <TextLink href="/tests">Ко всем тестам →</TextLink>
        </Empty>
      ) : error && !data ? (
        <RetryNotice error={error} onRetry={reload} />
      ) : isLoading && !data ? (
        <SkeletonRows rows={3} />
      ) : data ? (
        <Composition
          test={data.test}
          bank={data.bank}
          isLocked={isLocked}
          onLocked={() => setIsLocked(true)}
          refreshError={error}
          onRefresh={reload}
        />
      ) : null}
    </div>
  );
}

function Composition({
  test,
  bank,
  isLocked,
  onLocked,
  refreshError,
  onRefresh,
}: {
  test: Test;
  bank: Task[];
  isLocked: boolean;
  onLocked: () => void;
  refreshError: unknown;
  onRefresh: () => void;
}) {
  const byId = new Map(bank.map((task) => [task.id, task]));
  const composed = [...test.test_tasks].sort((a, b) => a.position - b.position || a.task_id - b.task_id);
  const totalPoints = composed.reduce((sum, item) => sum + item.points, 0);
  const usedPositions = composed.map((item) => item.position);
  const nextPosition = composed.length === 0 ? 1 : Math.max(...usedPositions) + 1;
  const usedTaskIds = new Set(composed.map((item) => item.task_id));
  const available = bank.filter((task) => !usedTaskIds.has(task.id));

  return (
    <>
      {refreshError ? <RetryNotice error={refreshError} onRetry={onRefresh} /> : null}

      <header>
        <Eyebrow>Тест № {test.id}</Eyebrow>
        <PageTitle>{test.title}</PageTitle>
        {test.description && (
          <p className="mt-5 max-w-xl text-base leading-relaxed whitespace-pre-line text-ink-soft">
            {test.description}
          </p>
        )}
        <p className={`mt-5 text-ink-soft ${MONO_LABEL}`}>
          {composed.length} {plural(composed.length, 'задание', 'задания', 'заданий')} ·{' '}
          {totalPoints} {plural(totalPoints, 'балл', 'балла', 'баллов')}
        </p>
      </header>

      {isLocked && (
        <Notice mark="ochre">
          Тест уже назначен — состав заданий изменить нельзя. Для другого набора создайте новый тест.
        </Notice>
      )}

      <Section index="01" title="Состав" aside={String(composed.length).padStart(2, '0')}>
        {composed.length === 0 ? (
          <Empty title="Заданий пока нет">
            Добавьте задания из банка — без них тест нельзя назначить.
          </Empty>
        ) : (
          <ol className="max-w-3xl">
            {composed.map((item) => {
              const task = byId.get(item.task_id);
              return (
                <li
                  key={item.task_id}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink/15 py-4"
                >
                  <div className="flex min-w-0 items-baseline gap-3">
                    <span className={`text-ink-soft ${MONO_LABEL}`}>
                      {String(item.position).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 truncate font-medium">
                      {task ? task.title : `Задание № ${item.task_id}`}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-5">
                    {task && <Tag mark="soft">{DIFFICULTY[task.difficulty]}</Tag>}
                    <span className={`tabular-nums text-ink-soft ${MONO_LABEL}`}>
                      {item.points} {plural(item.points, 'балл', 'балла', 'баллов')}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Section>

      {!isLocked && (
        <Section index="02" title="Добавить задание">
          {bank.length === 0 ? (
            <Empty title="Банк заданий пуст">
              Сначала создайте задания в библиотеке.{' '}
              <TextLink href="/library/tasks/new">Новое задание →</TextLink>
            </Empty>
          ) : (
            <TestTaskForm
              testId={test.id}
              available={available}
              nextPosition={nextPosition}
              usedPositions={usedPositions}
              onAdded={onRefresh}
              onLocked={onLocked}
            />
          )}
        </Section>
      )}

      <Section index={isLocked ? '02' : '03'} title="Назначить">
        <AssignTestForm testId={test.id} hasTasks={composed.length > 0} />
      </Section>
    </>
  );
}
