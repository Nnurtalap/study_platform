import type { Metadata } from 'next';
import Dashboard from '@/components/app/Dashboard';

export const metadata: Metadata = {
  title: 'Кабинет',
};

export default function DashboardPage() {
  return <Dashboard />;
}
