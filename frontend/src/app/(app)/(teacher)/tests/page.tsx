import type { Metadata } from 'next';
import TestsIndex from '@/components/app/teacher/TestsIndex';

export const metadata: Metadata = {
  title: 'Тесты',
};

export default function TestsPage() {
  return <TestsIndex />;
}
