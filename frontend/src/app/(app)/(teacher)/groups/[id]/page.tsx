import type { Metadata } from 'next';
import GroupView from '@/components/app/teacher/GroupView';

export const metadata: Metadata = {
  title: 'Группа',
};

export default async function GroupPage({ params }: PageProps<'/groups/[id]'>) {
  const { id } = await params;
  const groupId = Number(id);
  // Некорректный номер показываем как «группа не найдена», без запроса к API
  const validId = Number.isInteger(groupId) && groupId > 0 ? groupId : null;

  return <GroupView key={id} id={validId} />;
}
