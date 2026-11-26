'use client';

import { useState } from 'react';
import { getGroup, type GroupWithStudents } from '@/api/groups';
import { assignTest, getTest, type AssignTarget, type TestAssignment } from '@/api/tests';
import { FormError } from '@/components/auth/AuthUI';
import { MONO_LABEL } from '@/components/ui/styles';
import { useMutation } from '@/hooks/useMutation';
import { useQuery } from '@/hooks/useQuery';
import { useRecentIds } from '@/hooks/useRecentIds';
import { ActionButton, Choice, Field, Select } from '../form';
import { formatDate, Notice } from '../ui';

const MANUAL = 'manual';

// После назначения кабинет «слепой»: у API нет эндпоинта, который вернул бы
// результаты по тесту, поэтому единственная расписка — номер назначения.
function Result({ assignment }: { assignment: TestAssignment }) {
  const due = assignment.due_date && formatDate(assignment.due_date);

  return (
    <div className="space-y-4">
      <Notice mark="ink">
        <span>
          Назначение № {assignment.id} создано
          {assignment.group_id !== null ? ' для группы' : ' для студента'}
          {due && `, срок — ${due}`}.
        </span>
      </Notice>
      <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
        Тест появился у студентов в их кабинете. Посмотреть ответы и оценки здесь пока нельзя —
        у API нет эндпоинта для результатов назначения.
      </p>
    </div>
  );
}

function DueDateField({
  index,
  value,
  onChange,
}: {
  index: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field
      index={index}
      label="Срок сдачи"
      type="datetime-local"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      hint={<p className={`${MONO_LABEL} text-ink-soft`}>Необязательно — без срока тест бессрочный</p>}
    />
  );
}

// ——— Назначение теста на странице группы: группа известна, выбираем тест ———

export default function AssignForm({ group }: { group: GroupWithStudents }) {
  const { ids } = useRecentIds('tests');
  const recent = useQuery(`tests:${ids.join(',')}`, () => loadTests(ids));

  const [picked, setPicked] = useState('');
  const [manualId, setManualId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const { run, isLoading, error, reset } = useMutation(assignTest);
  const [assignment, setAssignment] = useState<TestAssignment | null>(null);

  const options = recent.data ?? [];
  const testId = picked === MANUAL ? Number(manualId) : Number(picked);
  const isReady = Number.isInteger(testId) && testId > 0 && group.students.length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await run(testId, { group_id: group.id }, dueDate || undefined);
    if (result) setAssignment(result);
  }

  if (assignment) {
    return (
      <div className="space-y-6">
        <Result assignment={assignment} />
        <button
          type="button"
          onClick={() => {
            setAssignment(null);
            reset();
          }}
          className="cursor-pointer font-medium text-ink decoration-signal decoration-2 underline-offset-[6px] outline-none hover:underline focus-visible:underline"
        >
          Назначить ещё один тест →
        </button>
      </div>
    );
  }

  if (group.students.length === 0) {
    return (
      <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
        В группе нет студентов — назначить тест пока нельзя. Добавьте хотя бы одного.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-9">
      <Select
        index="01"
        label="Тест"
        required
        value={picked}
        onChange={(event) => setPicked(event.target.value)}
      >
        {options.map((test) => (
          <option key={test.id} value={test.id}>
            {test.title} · № {test.id}
          </option>
        ))}
        <option value={MANUAL}>Другой — ввести номер</option>
      </Select>

      {picked === MANUAL && (
        <Field
          index="02"
          label="Номер теста"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          required
          placeholder="например 7"
          value={manualId}
          onChange={(event) => setManualId(event.target.value)}
        />
      )}

      <DueDateField index={picked === MANUAL ? '03' : '02'} value={dueDate} onChange={setDueDate} />

      {error && <FormError>{error}</FormError>}

      <ActionButton
        label="Назначить группе"
        loadingLabel="Назначаем"
        isLoading={isLoading}
        disabled={!isReady}
      />
    </form>
  );
}

async function loadTests(ids: number[]) {
  const results = await Promise.allSettled(ids.map(getTest));
  return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
}

async function loadGroups(ids: number[]) {
  const results = await Promise.allSettled(ids.map(getGroup));
  return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
}

// ——— Назначение на странице теста: тест известен, выбираем получателя ———

type Mode = 'group' | 'student';

export function AssignTestForm({ testId, hasTasks }: { testId: number; hasTasks: boolean }) {
  const { ids } = useRecentIds('groups');
  const recent = useQuery(`groups:${ids.join(',')}`, () => loadGroups(ids));

  const [mode, setMode] = useState<Mode>('group');
  const [pickedGroup, setPickedGroup] = useState('');
  const [manualGroupId, setManualGroupId] = useState('');
  const [pickedStudent, setPickedStudent] = useState('');
  const [manualStudentId, setManualStudentId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const { run, isLoading, error, reset } = useMutation(assignTest);
  const [assignment, setAssignment] = useState<TestAssignment | null>(null);

  const groups = recent.data ?? [];
  const groupId = pickedGroup === MANUAL ? Number(manualGroupId) : Number(pickedGroup);
  const roster = groups.find((group) => group.id === groupId)?.students ?? [];
  const studentId = pickedStudent === MANUAL ? Number(manualStudentId) : Number(pickedStudent);

  const isManualGroup = pickedGroup === MANUAL;
  const isStudentMode = mode === 'student';
  const needsManualStudent = isStudentMode && (pickedStudent === MANUAL || isManualGroup);

  // Часть полей условная — нумеруем по факту, иначе в подписях появляются пропуски
  const step = numbering([
    ['mode', true],
    ['group', true],
    ['groupId', isManualGroup],
    ['student', isStudentMode],
    ['studentId', needsManualStudent],
    ['due', true],
  ]);

  const target: AssignTarget | null =
    mode === 'group'
      ? Number.isInteger(groupId) && groupId > 0
        ? { group_id: groupId }
        : null
      : Number.isInteger(studentId) && studentId > 0
        ? { student_id: studentId }
        : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) return;
    const result = await run(testId, target, dueDate || undefined);
    if (result) setAssignment(result);
  }

  if (assignment) {
    return (
      <div className="space-y-6">
        <Result assignment={assignment} />
        <button
          type="button"
          onClick={() => {
            setAssignment(null);
            reset();
          }}
          className="cursor-pointer font-medium text-ink decoration-signal decoration-2 underline-offset-[6px] outline-none hover:underline focus-visible:underline"
        >
          Назначить ещё раз →
        </button>
      </div>
    );
  }

  // Бэкенд отклоняет назначение пустого теста — не даём дойти до ошибки
  if (!hasTasks) {
    return (
      <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
        Сначала добавьте в тест хотя бы одно задание — пустой тест назначить нельзя.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-9">
      <Choice
        index={step('mode')}
        label="Кому"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'group', label: 'Группе' },
          { value: 'student', label: 'Одному студенту' },
        ]}
      />

      <Select
        index={step('group')}
        label="Группа"
        required
        value={pickedGroup}
        onChange={(event) => {
          setPickedGroup(event.target.value);
          setPickedStudent('');
        }}
        hint={
          mode === 'student' ? (
            <p className={`${MONO_LABEL} text-ink-soft`}>
              Номер студента виден только в составе группы
            </p>
          ) : undefined
        }
      >
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name} · № {group.id}
          </option>
        ))}
        <option value={MANUAL}>Другая — ввести номер</option>
      </Select>

      {isManualGroup && (
        <Field
          index={step('groupId')}
          label="Номер группы"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          required
          value={manualGroupId}
          onChange={(event) => setManualGroupId(event.target.value)}
        />
      )}

      {isStudentMode && (
        <>
          <Select
            index={step('student')}
            label="Студент"
            required
            value={pickedStudent}
            disabled={isManualGroup || roster.length === 0}
            placeholder={
              pickedGroup === ''
                ? 'Сначала выберите группу'
                : roster.length === 0
                  ? 'В группе нет студентов'
                  : '—'
            }
            onChange={(event) => setPickedStudent(event.target.value)}
          >
            {roster.map((student) => (
              <option key={student.id} value={student.id}>
                {student.email} · № {student.id}
              </option>
            ))}
            <option value={MANUAL}>Другой — ввести номер</option>
          </Select>

          {needsManualStudent && (
            <Field
              index={step('studentId')}
              label="Номер студента"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              required
              value={manualStudentId}
              onChange={(event) => setManualStudentId(event.target.value)}
            />
          )}
        </>
      )}

      <DueDateField index={step('due')} value={dueDate} onChange={setDueDate} />

      {error && <FormError>{error}</FormError>}

      <ActionButton
        label={mode === 'group' ? 'Назначить группе' : 'Назначить студенту'}
        loadingLabel="Назначаем"
        isLoading={isLoading}
        disabled={!target}
      />
    </form>
  );
}

// Порядковые номера только для видимых полей
function numbering(fields: [key: string, isVisible: boolean][]) {
  const visible = fields.filter(([, isVisible]) => isVisible).map(([key]) => key);
  return (key: string) => String(visible.indexOf(key) + 1).padStart(2, '0');
}
