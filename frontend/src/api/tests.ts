import { ApiError } from './config';
import { authApi } from './authorized';

export interface TestTask {
  task_id: number;
  position: number;
  points: number;
}

export interface Test {
  id: number;
  title: string;
  description: string | null;
  test_tasks: TestTask[];
}

export interface TestAssignment {
  id: number;
  test_id: number;
  student_id: number | null;
  group_id: number | null;
  due_date: string | null;
}

// Бэкенд требует ровно один получатель (model_validator), поэтому тип размеченный:
// передать и то и другое одновременно нельзя по построению
export type AssignTarget = { student_id: number } | { group_id: number };

export function createTest(title: string, description?: string): Promise<Test> {
  return authApi.post<Test>('/api/v1/tests', {
    title,
    description: description?.trim() ? description : null,
  });
}

export function getTest(id: number): Promise<Test> {
  return authApi.get<Test>(`/api/v1/tests/${id}`);
}

export function addTaskToTest(testId: number, body: TestTask): Promise<TestTask> {
  return authApi.post<TestTask>(`/api/v1/tests/${testId}/tasks`, body);
}

// `<input type="datetime-local">` отдаёт «2026-11-03T18:30» без смещения,
// а бэкенд ждёт AwareDatetime. new Date() читает это как локальное время,
// toISOString() даёт «…Z» — смещение посчитано движком, с учётом перехода на летнее время.
export function toAwareIso(localValue: string): string {
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(0, null, 'Неверная дата и время');
  }
  return date.toISOString();
}

export function assignTest(
  testId: number,
  target: AssignTarget,
  dueDateLocal?: string,
): Promise<TestAssignment> {
  return authApi.post<TestAssignment>(`/api/v1/tests/${testId}/assignments`, {
    ...target,
    due_date: dueDateLocal ? toAwareIso(dueDateLocal) : null,
  });
}
