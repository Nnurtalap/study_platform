import type { Metadata } from 'next';
import GroupsIndex from '@/components/app/teacher/GroupsIndex';

export const metadata: Metadata = {
  title: 'Группы',
};

export default function GroupsPage() {
  return <GroupsIndex />;
}
