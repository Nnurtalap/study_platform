import { useCallback, useState } from 'react';
import { translateError } from '@/components/auth/translateError';

// Отправка данных: одна и та же тройка состояний для всех форм кабинета.
// error уже переведён для показа, rawError нужен, чтобы ветвиться по статусу
// (409 блокирует состав теста, 404 предлагает забыть id).
export function useMutation<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [rawError, setRawError] = useState<unknown>(null);

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      setRawError(null);
      setIsLoading(true);
      try {
        return await action(...args);
      } catch (err) {
        setRawError(err);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    // action пересоздаётся на каждом рендере — как и в useQuery, это осознанно
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const reset = useCallback(() => setRawError(null), []);

  return {
    run,
    isLoading,
    rawError,
    error: rawError === null ? null : translateError(rawError),
    reset,
  };
}
