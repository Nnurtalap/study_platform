'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import {
  completeAssignment,
  getMyAssignment,
  getSubmission,
  submitAnswer,
  type StudentAssignmentDetail,
  type StudentTask,
} from '@/api/assignments';
import { FormError } from '@/components/auth/AuthUI';
import { translateError } from '@/components/auth/translateError';
import Spinner from '@/components/ui/Spinner';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT } from '@/components/ui/styles';
import { useQuery } from '@/hooks/useQuery';
import { Badge, DIFFICULTY, formatDate, Notice, plural, SkeletonList, StatusBadge } from './ui';

export default function AssignmentView({ id }: { id: number }) {
  const { data, error, isLoading, reload } = useQuery(`assignment-${id}`, () => getMyAssignment(id));

  return (
    <div className="fade-in space-y-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-ink-soft outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span aria-hidden>←</span> Все тесты
      </Link>

      {error ? (
        <Notice tone="danger">
          <span>{translateError(error)}</span>
          <button type="button" onClick={reload} className={BUTTON_SECONDARY}>
            Повторить
          </button>
        </Notice>
      ) : isLoading && !data ? (
        <>
          <div className="skeleton h-9 w-2/3 rounded-lg" />
          <SkeletonList rows={3} />
        </>
      ) : data ? (
        <Assignment assignment={data} onChange={reload} />
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

  return (
    <>
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={assignment.status} />
          {assignment.due_date && (
            <span className="text-xs text-ink-soft">Срок — {formatDate(assignment.due_date)}</span>
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {assignment.title}
        </h1>
        {assignment.description && (
          <p className="max-w-2xl text-sm leading-relaxed whitespace-pre-line text-ink-soft">
            {assignment.description}
          </p>
        )}

        <div className="flex max-w-md items-center gap-3 pt-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-ink transition-[width] duration-500"
              style={{ width: tasks.length ? `${(answered / tasks.length) * 100}%` : 0 }}
            />
          </div>
          <span className="text-xs tabular-nums text-ink-soft">
            {answered} из {tasks.length} · {totalPoints}{' '}
            {plural(totalPoints, 'балл', 'балла', 'баллов')}
          </span>
        </div>
      </header>

      {assignment.status === 'overdue' && (
        <Notice tone="danger">Срок сдачи истёк — отправить ответы уже нельзя.</Notice>
      )}

      <ol className="space-y-3">
        {tasks.map((task, i) => (
          <TaskCard
            key={task.id}
            number={i + 1}
            task={task}
            assignmentId={assignment.id}
            canSubmit={assignment.can_submit}
            onSubmitted={onChange}
          />
        ))}
      </ol>

      {assignment.status === 'completed' ? (
        <Notice tone="success">Тест завершён — оценки появятся у каждого ответа после проверки.</Notice>
      ) : (
        assignment.can_submit && (
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

function TaskCard({
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
    <li className={`${CARD} p-5 sm:p-6`}>
      <div className="flex items-start gap-4">
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums ${
            isAnswered ? 'bg-ink text-paper' : 'bg-line/70 text-ink-soft'
          }`}
        >
          {isAnswered ? '✓' : number}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="font-medium text-ink">{task.title}</h2>
            <span className="text-xs text-ink-soft">
              {DIFFICULTY[task.difficulty]} · {task.points}{' '}
              {plural(task.points, 'балл', 'балла', 'баллов')}
            </span>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-ink">{task.body}</p>

          <div className="mt-4">
            {task.submission_id !== null ? (
              <SubmissionView id={task.submission_id} maxPoints={task.points} />
            ) : canSubmit ? (
              <AnswerForm assignmentId={assignmentId} taskId={task.id} onSubmitted={onSubmitted} />
            ) : (
              <p className="text-sm text-ink-soft">Ответ не был отправлен.</p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

const MAX_ANSWER_LENGTH = 20000;

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
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await submitAnswer(assignmentId, taskId, answer.trim());
      onSubmitted();
    } catch (err) {
      setError(translateError(err));
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor={id} className="sr-only">
        Ваш ответ
      </label>
      <textarea
        id={id}
        rows={4}
        required
        maxLength={MAX_ANSWER_LENGTH}
        placeholder="Ваш ответ…"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className={`${INPUT} resize-y py-2.5 leading-relaxed`}
      />
      {error && <FormError>{error}</FormError>}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-ink-soft">Ответ можно отправить только один раз</span>
        <button
          type="submit"
          disabled={isLoading || answer.trim().length === 0}
          className={BUTTON_PRIMARY}
        >
          {isLoading && <Spinner className="size-3.5" />}
          Отправить
        </button>
      </div>
    </form>
  );
}

function SubmissionView({ id, maxPoints }: { id: number; maxPoints: number }) {
  const { data, error } = useQuery(`submission-${id}`, () => getSubmission(id));

  if (error) return <p className="text-sm text-danger">{translateError(error)}</p>;
  if (!data) return <div aria-hidden className="skeleton h-12 rounded-lg" />;

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-line/40 px-3.5 py-3">
        <p className="text-xs text-ink-soft">Ваш ответ</p>
        <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-ink">{data.answer_text}</p>
      </div>

      {data.status === 'pending' && <Badge tone="warning">На проверке</Badge>}
      {data.status === 'failed' && <Badge tone="danger">Не удалось проверить</Badge>}
      {data.status === 'graded' && data.analys && (
        <div className="rounded-lg border border-line px-3.5 py-3">
          <div className="flex items-center gap-2">
            <Badge tone="success">Оценено</Badge>
            <span className="text-sm font-semibold tabular-nums text-ink">
              {data.analys.score}
              <span className="font-normal text-ink-soft"> / {maxPoints}</span>
            </span>
          </div>
          {data.analys.feedback && (
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{data.analys.feedback}</p>
          )}
          {data.analys.weak_topics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {data.analys.weak_topics.map((topic) => (
                <Badge key={topic}>{topic}</Badge>
              ))}
            </div>
          )}
        </div>
      )}
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
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setError(null);
    setIsLoading(true);

    try {
      await completeAssignment(assignmentId);
      onCompleted();
    } catch (err) {
      setError(translateError(err));
      setIsLoading(false);
    }
  }

  return (
    <div className={`${CARD} space-y-3 p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {isReady
            ? 'Все ответы отправлены — можно завершать тест.'
            : `Осталось ответить на ${remaining} ${plural(remaining, 'задание', 'задания', 'заданий')}.`}
        </p>
        <button
          type="button"
          onClick={handleComplete}
          disabled={!isReady || isLoading}
          className={BUTTON_PRIMARY}
        >
          {isLoading && <Spinner className="size-3.5" />}
          Завершить тест
        </button>
      </div>
      {error && <FormError>{error}</FormError>}
    </div>
  );
}
