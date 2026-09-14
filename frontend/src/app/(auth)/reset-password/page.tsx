import type { Metadata } from 'next';
import ResetPassword from '@/components/auth/ResetPassword';

export const metadata: Metadata = {
  title: 'Новый пароль',
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { token } = await searchParams;

  return <ResetPassword initialToken={typeof token === 'string' ? token : undefined} />;
}
