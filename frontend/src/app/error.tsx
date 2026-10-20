'use client';

import ErrorScreen from '@/components/ui/ErrorScreen';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorScreen
      code="500 / Сбой"
      title="Что-то сломалось"
      description="Страницу не удалось показать. Попробуйте ещё раз — если не поможет, перезагрузите страницу позже."
      reset={reset}
    />
  );
}
