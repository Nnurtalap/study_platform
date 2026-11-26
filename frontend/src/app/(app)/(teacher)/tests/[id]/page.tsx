import type { Metadata } from 'next';
import TestView from '@/components/app/teacher/TestView';

export const metadata: Metadata = {
  title: 'Тест',
};

export default async function TestPage({ params }: PageProps<'/tests/[id]'>) {
  const { id } = await params;
  const testId = Number(id);
  // Некорректный номер показываем как «тест не найден», без запроса к API
  const validId = Number.isInteger(testId) && testId > 0 ? testId : null;

  return <TestView key={id} id={validId} />;
}
