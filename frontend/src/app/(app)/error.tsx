'use client';

import ErrorScreen from '@/components/ui/ErrorScreen';

// Своя граница у кабинета: сбой одной страницы не должен выбрасывать из него целиком
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorScreen
      code="500 / Кабинет"
      title="Раздел не открылся"
      description="Данные не удалось показать. Попробуйте снова — остальные разделы кабинета работают."
      reset={reset}
    />
  );
}
