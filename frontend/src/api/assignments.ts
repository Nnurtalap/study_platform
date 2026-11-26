import { authApi } from './authorized';

export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'overdue';
export type TaskType = 'single_choice' | 'multiple_choice' | 'open_answer';
export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type SubmissionStatus = 'pending' | 'graded' | 'failed';

export interface StudentAssignment {
  id: number;
  test_id: number;
  student_id: number;
  group_id: number | null;
  due_date: string | null;
  status: AssignmentStatus;
  can_submit: boolean;
}

export interface StudentTask {
  id: number;
  title: string;
  body: string;
  task_type: TaskType;
  difficulty: TaskDifficulty;
  position: number;
  points: number;
  submission_id: number | null;
}

export interface StudentAssignmentDetail extends StudentAssignment {
  title: string;
  description: string | null;
  tasks: StudentTask[];
}

export interface Submission {
  id: number;
  task_id: number;
  test_assignment_id: number;
  answer_text: string;
  status: SubmissionStatus;
  analys: { score: number; feedback: string; weak_topics: string[] } | null;
}

export function listMyAssignments(): Promise<StudentAssignment[]> {
  return authApi.get<StudentAssignment[]>('/api/v1/me/assignments');
}

export function getMyAssignment(id: number): Promise<StudentAssignmentDetail> {
  return authApi.get<StudentAssignmentDetail>(`/api/v1/me/assignments/${id}`);
}

export function completeAssignment(id: number): Promise<StudentAssignment> {
  return authApi.post<StudentAssignment>(`/api/v1/me/assignments/${id}/complete`);
}

export function submitAnswer(assignmentId: number, taskId: number, answerText: string): Promise<Submission> {
  return authApi.post<Submission>(`/api/v1/test-assignment/${assignmentId}/submissions`, {
    task_id: taskId,
    answer_text: answerText,
  });
}

export function getSubmission(id: number): Promise<Submission> {
  return authApi.get<Submission>(`/api/v1/submission/${id}`);
}
