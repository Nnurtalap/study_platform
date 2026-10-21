import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import CodeCity from '@/components/city/CodeCity';
import { scanRepo } from '@/lib/codeScan';

export const metadata: Metadata = {
  title: 'Город кода',
  robots: { index: false, follow: false },
};

export default async function CityPage() {
  // Страница отдаёт исходники проекта целиком, поэтому существует только в dev.
  // Гейт стоит до любого обращения к диску, так что прод-сборка ничего не читает.
  if (process.env.NODE_ENV !== 'development') notFound();

  // cacheComponents выключен, поэтому io() здесь был бы no-op, а снятый в Next 16
  // `export const dynamic` держится только на старой модели кеша: перечитывать
  // код на каждый запрос заставляет connection().
  await connection();

  const { files } = await scanRepo();

  return <CodeCity files={files} />;
}
