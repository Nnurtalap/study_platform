import type { Metadata } from 'next';
import Library from '@/components/app/teacher/Library';

export const metadata: Metadata = {
  title: 'Библиотека',
};

export default function LibraryPage() {
  return <Library />;
}
