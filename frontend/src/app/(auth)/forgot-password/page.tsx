import type { Metadata } from 'next';
import ForgotPassword from '@/components/auth/ForgotPassword';

export const metadata: Metadata = {
  title: 'Восстановление пароля',
};

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
