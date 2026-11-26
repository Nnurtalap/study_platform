'use client';

import { useEffect, useState } from 'react';
import type { Task } from '@/api/library';
import { ApiError } from '@/api/config';
import { addTaskToTest, type TestTask } from '@/api/tests';
import { FormError } from '@/components/auth/AuthUI';
import { MONO_LABEL } from '@/components/ui/styles';
import { useMutation } from '@/hooks/useMutation';
import { ActionButton, Field, Select } from '../form';
import { DIFFICULTY } from '../ui';

export default function TestTaskForm({
  testId,
  available,
  nextPosition,
  usedPositions,
  onAdded,
  onLocked,
}: {
  testId: number;
  available: Task[];
  nextPosition: number;
  usedPositions: number[];
  onAdded: () => void;
  onLocked: () => void;
}) {
  const [taskId, setTaskId] = useState('');
  const [position, setPosition] = useState(String(nextPosition));
  const [points, setPoints] = useState('1');
  const { run, isLoading, error, rawError } = useMutation(addTaskToTest);

  const positionNumber = Number(position);
  const pointsNumber = Number(points);
  // Бэкенд не проверяет позиции на уникальность — предупреждаем, но не запрещаем
  const isDuplicatePosition = usedPositions.includes(positionNumber);
  const isReady =
    Number(taskId) > 0 && Number.isInteger(positionNumber) && positionNumber > 0 && Number.isInteger(pointsNumber) && pointsNumber > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body: TestTask = {
      task_id: Number(taskId),
      position: positionNumber,
      points: pointsNumber,
    };

    const added = await run(testId, body);
    if (added) {
      setTaskId('');
      setPosition(String(positionNumber + 1));
      setPoints('1');
      onAdded();
    }
  }

  // Состав уже назначенного теста заморожен — отличаем именно эту 409
  // от «задание уже в тесте», которое приходит с тем же статусом
  const isLocked =
    rawError instanceof ApiError &&
    rawError.status === 409 &&
    rawError.detail === 'Assigned test cannot be modified';

  useEffect(() => {
    if (isLocked) onLocked();
    // onLocked пересоздаётся родителем на каждом рендере
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked]);

  if (available.length === 0) {
    return (
      <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
        Все ваши задания уже в тесте. Создайте новое в библиотеке, чтобы добавить ещё.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-9">
      <Select
        index="01"
        label="Задание"
        required
        value={taskId}
        onChange={(event) => setTaskId(event.target.value)}
      >
        {available.map((task) => (
          <option key={task.id} value={task.id}>
            {task.title} · {DIFFICULTY[task.difficulty]} · № {task.id}
          </option>
        ))}
      </Select>

      <div className="grid gap-9 sm:grid-cols-2">
        <Field
          index="02"
          label="Позиция"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          required
          value={position}
          onChange={(event) => setPosition(event.target.value)}
          invalid={isDuplicatePosition}
          hint={
            isDuplicatePosition ? (
              <p className={`${MONO_LABEL} text-signal-deep`}>Позиция уже занята — порядок будет неоднозначным</p>
            ) : undefined
          }
        />
        <Field
          index="03"
          label="Баллы"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          required
          value={points}
          onChange={(event) => setPoints(event.target.value)}
        />
      </div>

      {error && <FormError>{error}</FormError>}

      <ActionButton
        label="Добавить в тест"
        loadingLabel="Добавляем"
        isLoading={isLoading}
        disabled={!isReady || isLocked}
      />
    </form>
  );
}
