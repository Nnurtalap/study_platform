import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AssignmentView from '@/components/app/AssignmentView';

export const metadata: Metadata = {
  title: 'Тест',
};

export default async function AssignmentPage({
  params,
}: PageProps<'/dashboard/assignments/[id]'>) {
  const { id } = await params;
  const assignmentId = Number(id);

  if (!Number.isInteger(assignmentId) || assignmentId <= 0) notFound();

  return <AssignmentView key={assignmentId} id={assignmentId} />;
}
