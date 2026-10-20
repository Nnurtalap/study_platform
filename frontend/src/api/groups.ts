import { authApi } from './authorized';

export interface Group {
  id: number;
  name: string;
}

export interface GroupStudent {
  id: number;
  email: string;
}

export interface GroupWithStudents extends Group {
  students: GroupStudent[];
}

export function createGroup(name: string): Promise<Group> {
  return authApi.post<Group>('/api/v1/groups', { name });
}

// Единственное место в API, где можно узнать student_id — состав группы
export function getGroup(id: number): Promise<GroupWithStudents> {
  return authApi.get<GroupWithStudents>(`/api/v1/groups/${id}`);
}

export function enrollStudent(groupId: number, studentEmail: string): Promise<{ detail: string }> {
  return authApi.post<{ detail: string }>(`/api/v1/groups/${groupId}/enrollments`, {
    student_email: studentEmail,
  });
}
