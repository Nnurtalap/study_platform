import type { Metadata } from 'next';
import Logout from '@/components/auth/Logout';

export const metadata: Metadata = {
  title: 'Выход',
};

export default function LogoutPage() {
  return <Logout />;
}
