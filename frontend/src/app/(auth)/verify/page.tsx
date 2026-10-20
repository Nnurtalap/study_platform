import type { Metadata } from 'next';
import VerifyEmail from '@/components/auth/VerifyEmail';

export const metadata: Metadata = {
  title: 'Подтверждение почты',
};

export default async function VerifyPage({ searchParams }: PageProps<'/verify'>) {
  const { token } = await searchParams;

  return <VerifyEmail initialToken={typeof token === 'string' ? token : undefined} />;
}
