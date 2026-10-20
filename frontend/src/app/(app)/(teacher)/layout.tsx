import TeacherGate from '@/components/app/teacher/TeacherGate';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <TeacherGate>{children}</TeacherGate>;
}
