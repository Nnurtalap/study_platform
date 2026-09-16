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

export function listTopics(subjectId: number): Promise<Topic[]> {
  return authApi.get<Topic[]>(`/api/v1/subjects/${subjectId}/topics`);
}

export function listTasks(): Promise<Task[]> {
  return authApi.get<Task[]>('/api/v1/tasks');
}
