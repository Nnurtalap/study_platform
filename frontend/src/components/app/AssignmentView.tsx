'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import {
  completeAssignment,
  getMyAssignment,
  getSubmission,
  submitAnswer,
  type StudentAssignmentDetail,
  type StudentTask,
} from '@/api/assignments';
import { ApiError } from '@/api/config';
import { FormError, TextLink } from '@/components/auth/AuthUI';
import { translateError } from '@/components/auth/translateError';
import Spinner from '@/components/ui/Spinner';
import { BUTTON_PRIMARY, BUTTON_TEXT, MONO_LABEL } from '@/components/ui/styles';
import { useQuery } from '@/hooks/useQuery';
import {
  Arrow,
  DIFFICULTY,
  Empty,
  Eyebrow,
  formatDate,
  Notice,
  PageTitle,
  plural,
  ProgressBar,
  RetryNotice,
  SkeletonRows,
  StatusTag,
  Tag,
} from './ui';

export default function AssignmentView({ id }: { id: number | null }) {
  const { data, error, isLoading, reload } = useQuery(id === null ? null : `assignment-${id}`, () =>
    getMyAssignment(id!),
  );
  const isNotFound = id === null || (error instanceof ApiError && error.status === 404);

  return (
    <div className="auth-enter space-y-12">
      <Link
        href="/dashboard"
        className="group inline-flex items-baseline gap-2 text-sm font-medium outline-none hover:text-signal-deep focus-visible:text-signal-deep"
      >
        <span aria-hidden className="transition-transform duration-500 ease-swiss group-hover:-translate-x-1">
          ←
        </span>
        Все тесты
      </Link>

      {isNotFound ? (
        <Empty title="Тест не найден">
          Возможно, его сняли с назначения или ссылка неверна.{' '}
          <TextLink href="/dashboard">Ко всем тестам →</TextLink>
        </Empty>
      ) : error && !data ? (
        <RetryNotice error={error} onRetry={reload} />
      ) : isLoading && !data ? (
        <SkeletonRows rows={3} />
      ) : data ? (
        <>
          {/* Упавшее обновление оставляет тест на экране — иначе ответы «исчезают» */}
          {error ? <RetryNotice error={error} onRetry={reload} /> : null}
          <Assignment assignment={data} onChange={reload} />
        </>
      ) : null}
    </div>
  );
}

function Assignment({
  assignment,
  onChange,
}: {
  assignment: StudentAssignmentDetail;
  onChange: () => void;
}) {
  const { tasks } = assignment;
  const answered = tasks.filter((task) => task.submission_id !== null).length;
  const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);
  const isAllAnswered = tasks.length > 0 && answered === tasks.length;
  const due = assignment.due_date && formatDate(assignment.due_date);

  return (
    <>
      <header>
        <Eyebrow>Тест{due && ` / до ${due}`}</Eyebrow>
        <PageTitle>{assignment.title}</PageTitle>
        {assignment.description && (
          <p className="mt-5 max-w-xl text-base leading-relaxed whitespace-pre-line text-ink-soft">
            {assignment.description}
          </p>
        )}

        <div className="mt-8 flex max-w-xl flex-wrap items-center gap-x-6 gap-y-3">
          <StatusTag status={assignment.status} />
          <div className="flex min-w-48 flex-1 items-center gap-3">
            <ProgressBar value={answered} total={tasks.length} />
            <span className={`tabular-nums text-ink-soft ${MONO_LABEL}`}>
              {answered}/{tasks.length} · {totalPoints} {plural(totalPoints, 'балл', 'балла', 'баллов')}
            </span>
          </div>
        </div>
      </header>

      {assignment.status === 'overdue' && (
        <Notice mark="signal">Срок сдачи истёк — отправить ответы уже нельзя.</Notice>
      )}

      {tasks.length === 0 ? (
        <Empty title="В тесте нет заданий">
          Преподаватель ещё не добавил задания — отвечать пока нечего.
        </Empty>
      ) : (
        <ol className="max-w-3xl">
          {tasks.map((task, i) => (
            <TaskItem
              key={task.id}
              number={i + 1}
              task={task}
              assignmentId={assignment.id}
              canSubmit={assignment.can_submit}
              onSubmitted={onChange}
            />
          ))}
        </ol>
      )}

      {assignment.status === 'completed' ? (
        <Notice mark="ink">Тест завершён — оценки появятся у каждого ответа после проверки.</Notice>
      ) : (
        assignment.can_submit &&
        tasks.length > 0 && (
          <CompleteBar
            assignmentId={assignment.id}
            isReady={isAllAnswered}
            remaining={tasks.length - answered}
            onCompleted={onChange}
          />
        )
      )}
    </>
  );
}

function TaskItem({
  number,
  task,
  assignmentId,
  canSubmit,
  onSubmitted,
}: {
  number: number;
  task: StudentTask;
  assignmentId: number;
  canSubmit: boolean;
  onSubmitted: () => void;
}) {
  const isAnswered = task.submission_id !== null;

  return (
    <li className="relative border-t-2 border-ink pt-4 pb-12">
      {isAnswered && <span aria-hidden className="absolute -top-0.5 left-0 h-0.5 w-full bg-signal" />}

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="flex items-baseline gap-3">
          <span className={`${isAnswered ? 'text-signal-deep' : 'text-ink-soft'} ${MONO_LABEL}`}>
            {String(number).padStart(2, '0')}
          </span>
          <span className="text-xl font-medium tracking-tight">{task.title}</span>
        </h2>
        <span className={`text-ink-soft ${MONO_LABEL}`}>
          {DIFFICULTY[task.difficulty]} · {task.points} {plural(task.points, 'балл', 'балла', 'баллов')}
        </span>
      </div>

      <p className="mt-4 text-lg leading-relaxed whitespace-pre-line">{task.body}</p>

      <div className="mt-6">
        {task.submission_id !== null ? (
          <SubmissionView id={task.submission_id} maxPoints={task.points} />
        ) : canSubmit ? (
          <AnswerForm assignmentId={assignmentId} taskId={task.id} onSubmitted={onSubmitted} />
        ) : (
          <p className={`text-ink-soft ${MONO_LABEL}`}>Ответ не был отправлен</p>
        )}
      </div>
    </li>
  );
}

const MAX_ANSWER_LENGTH = 20000;

// 400/409 значат, что состояние теста изменилось (срок истёк, ответ ушёл из другой вкладки)
function isStaleStateError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 400 || err.status === 409);
}

// Черновик хранится локально, чтобы ответ не пропал при уходе со страницы
function draftKey(assignmentId: number, taskId: number) {
  return `draft:${assignmentId}:${taskId}`;
}

function readDraft(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function writeDraft(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // хранилище недоступно (приватный режим) — черновик просто не сохранится
  }
}

function AnswerForm({
  assignmentId,
  taskId,
  onSubmitted,
}: {
  assignmentId: number;
  taskId: number;
  onSubmitted: () => void;
}) {
  const id = useId();
  const storageKey = draftKey(assignmentId, taskId);
  const [answer, setAnswer] = useState(() => readDraft(storageKey));
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await submitAnswer(assignmentId, taskId, answer.trim());
      writeDraft(storageKey, '');
      // Ответ уже на сервере: форму не возвращаем, повторная отправка дала бы 409
      setIsSent(true);
      onSubmitted();
    } catch (err) {
      setError(translateError(err));
      if (isStaleStateError(err)) onSubmitted();
    } finally {
      setIsLoading(false);
    }
  }

  // Обычно обновление данных размонтирует форму; если оно упало — объясняем состояние
  if (isSent) {
    return (
      <Notice mark="ochre">
        <span>Ответ отправлен — обновляем страницу.</span>
        <button type="button" onClick={onSubmitted} className={BUTTON_TEXT}>
          Обновить →
        </button>
      </Notice>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor={id} className={`text-ink-soft ${MONO_LABEL}`}>
          Ваш ответ
        </label>
        <div className="relative mt-1">
          <textarea
            id={id}
            rows={3}
            required
            maxLength={MAX_ANSWER_LENGTH}
            placeholder="Напишите решение…"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              writeDraft(storageKey, e.target.value);
            }}
            className="peer block w-full resize-y rounded-none border-0 border-b-2 border-ink bg-transparent px-0 py-3 text-lg leading-relaxed outline-none placeholder:text-ink/25"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-signal transition-transform duration-500 ease-swiss peer-focus:scale-x-100"
          />
        </div>
      </div>

      {error && <FormError>{error}</FormError>}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className={`text-ink-soft ${MONO_LABEL}`}>Отправить можно один раз</span>
        <button
          type="submit"
          disabled={isLoading || answer.trim().length === 0}
          aria-busy={isLoading}
          className={BUTTON_PRIMARY}
        >
          <span className="font-medium">{isLoading ? 'Отправляем' : 'Отправить'}</span>
          {isLoading ? <Spinner className="bg-paper" /> : <Arrow />}
        </button>
      </div>
    </form>
  );
}

const POLL_INTERVAL_MS = 15_000;

function SubmissionView({ id, maxPoints }: { id: number; maxPoints: number }) {
  const { data, error, reload } = useQuery(`submission-${id}`, () => getSubmission(id));
  const isPending = data?.status === 'pending';

  // Пока ответ на проверке, тихо опрашиваем сервер; в фоновой вкладке не тратим запросы.
  // Интервал свой на каждый ответ: ИИ-оценка ещё не подключена (TODO Фаза 4 на бэкенде),
  // так что объединять опрос в один запрос пока не на чем проверить.
  useEffect(() => {
    if (!isPending) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') reload();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isPending, reload]);

  if (!data && error) return <FormError>{translateError(error)}</FormError>;
  if (!data) return <div aria-hidden className="skeleton h-14" />;

  // Слабые темы приходят от ИИ и могут повторяться — ключи должны остаться уникальными
  const weakTopics = data.analys ? [...new Set(data.analys.weak_topics)] : [];

  return (
    <div className="grid gap-6 border-l-2 border-ink/15 pl-5 sm:grid-cols-[1fr_auto]">
      <div>
        <p className={`text-ink-soft ${MONO_LABEL}`}>Ваш ответ</p>
        <p className="mt-2 leading-relaxed whitespace-pre-line">{data.answer_text}</p>

        {data.status === 'graded' && data.analys && (
          <>
            {data.analys.feedback && (
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">{data.analys.feedback}</p>
            )}
            {weakTopics.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {weakTopics.map((topic) => (
                  <Tag key={topic} mark="signal">
                    {topic}
                  </Tag>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="sm:text-right">
        {data.status === 'pending' && <Tag mark="ochre">На проверке</Tag>}
        {data.status === 'failed' && <Tag mark="signal">Не проверено</Tag>}
        {data.status === 'graded' && data.analys && (
          <p className="text-5xl font-semibold tracking-[-0.04em] tabular-nums">
            {data.analys.score}
            <span className="text-2xl text-ink-soft">/{maxPoints}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function CompleteBar({
  assignmentId,
  isReady,
  remaining,
  onCompleted,
}: {
  assignmentId: number;
  isReady: boolean;
  remaining: number;
  onCompleted: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setError(null);
    setIsLoading(true);

    try {
      await completeAssignment(assignmentId);
      setIsDone(true);
      onCompleted();
    } catch (err) {
      setError(translateError(err));
      if (isStaleStateError(err)) onCompleted();
    } finally {
      setIsLoading(false);
    }
  }

  if (isDone) {
    return (
      <Notice mark="ink">
        <span>Тест завершён — обновляем страницу.</span>
        <button type="button" onClick={onCompleted} className={BUTTON_TEXT}>
          Обновить →
        </button>
      </Notice>
    );
  }

  return (
    <div className="max-w-3xl space-y-4 border-t border-ink/15 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-ink-soft">
          {isReady
            ? 'Все ответы отправлены — можно завершать тест.'
            : `Осталось ответить на ${remaining} ${plural(remaining, 'задание', 'задания', 'заданий')}.`}
        </p>
        <button
          type="button"
          onClick={handleComplete}
          disabled={!isReady || isLoading}
          aria-busy={isLoading}
          className={`${BUTTON_PRIMARY} sm:w-72`}
        >
          <span
            aria-hidden
            className="absolute inset-0 origin-left scale-x-0 bg-signal transition-transform duration-500 ease-swiss group-enabled:group-hover:scale-x-100"
          />
          <span className="relative text-lg font-medium tracking-tight">Завершить тест</span>
          <span className="relative">{isLoading ? <Spinner className="bg-paper" /> : <Arrow />}</span>
        </button>
      </div>
      {error && <FormError>{error}</FormError>}
    </div>
  );
}
