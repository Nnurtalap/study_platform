import type { TaskDifficulty, TaskType } from './assignments';
import { authApi } from './authorized';

export interface Subject {
  id: number;
  name: string;
  slug: string;
}

export interface Topic {
  id: number;
  name: string;
  subject_id: number;
}

export interface Task {
  id: number;
  title: string;
  body: string;
  task_type: TaskType;
  difficulty: TaskDifficulty;
  topic_id: number;
  correct_answer: string;
}

export function listSubjects(): Promise<Subject[]> {
  return authApi.get<Subject[]>('/api/v1/subjects');
}

export function createSubject(name: string, slug: string): Promise<Subject> {
  return authApi.post<Subject>('/api/v1/subjects', { name, slug });
}

export function listTopics(subjectId: number): Promise<Topic[]> {
  return authApi.get<Topic[]>(`/api/v1/subjects/${subjectId}/topics`);
}

// Бэкенд принимает поле `topic`, а в ответе отдаёт `name` — расхождение прячем здесь
export function createTopic(subjectId: number, topic: string): Promise<Topic> {
  return authApi.post<Topic>(`/api/v1/subjects/${subjectId}/topics`, { topic });
}

// Бэкенд отдаёт только задания текущего преподавателя — банк заданий личный
export function listTasks(topicId?: number): Promise<Task[]> {
  return authApi.get<Task[]>('/api/v1/tasks', { params: { topic_id: topicId } });
}

// task_type на бэкенде объявлен как Literal[OPEN_ANSWER] — другие значения отклоняются
export const TASK_TYPE_OPEN_ANSWER = 'open_answer' as const;

export interface TaskInput {
  title: string;
  body: string;
  difficulty: TaskDifficulty;
  topic_id: number;
  correct_answer: string;
}

export function createTask(data: TaskInput): Promise<Task> {
  return authApi.post<Task>('/api/v1/tasks', {
    ...data,
    task_type: TASK_TYPE_OPEN_ANSWER,
  });
}
