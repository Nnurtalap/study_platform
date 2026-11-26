import type { Metadata } from 'next';
import AssignmentView from '@/components/app/AssignmentView';

export const metadata: Metadata = {
  title: 'Тест',
};

export default async function AssignmentPage({
  params,
}: PageProps<'/dashboard/assignments/[id]'>) {
  const { id } = await params;
  const assignmentId = Number(id);
  // Некорректный id показываем как «тест не найден» внутри кабинета, без запроса к API
  const validId = Number.isInteger(assignmentId) && assignmentId > 0 ? assignmentId : null;

  return <AssignmentView key={id} id={validId} />;
}
