import type { Metadata } from 'next';
import TaskForm from '@/components/app/teacher/TaskForm';

export const metadata: Metadata = {
  title: 'Новое задание',
};

export default function NewTaskPage() {
  return <TaskForm />;
}
