import type { Metadata } from 'next';
import Register from '@/components/auth/Register';

export const metadata: Metadata = {
  title: 'Регистрация',
};

export default function RegisterPage() {
  return <Register />;
}
