import type { Metadata } from 'next';
import Login from '@/components/auth/Login';

export const metadata: Metadata = {
  title: 'Вход',
};

export default function LoginPage() {
  return <Login />;
}
