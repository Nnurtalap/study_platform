import type { Metadata } from 'next';
import VerifyEmail from '@/components/auth/VerifyEmail';

export const metadata: Metadata = {
  title: 'Подтверждение почты',
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { token } = await searchParams;

  return <VerifyEmail initialToken={typeof token === 'string' ? token : undefined} />;
}
