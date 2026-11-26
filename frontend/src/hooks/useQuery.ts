import { useCallback, useEffect, useState } from 'react';

type Result<T> = { key: string; version: number; data?: T; error?: unknown };

// Минимальная загрузка данных: результат привязан к ключу, поэтому при смене ключа
// старые данные не показываются, а состояние загрузки выводится без лишних setState.
export function useQuery<T>(key: string | null, fetcher: () => Promise<T>) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    if (key === null) return;
    let isCancelled = false;

    fetcher().then(
      (data) => !isCancelled && setResult({ key, version, data }),
      // Упавшее обновление не стирает уже показанные данные того же запроса
      (error: unknown) =>
        !isCancelled &&
        setResult((prev) => ({
          key,
          version,
          error,
          data: prev?.key === key ? prev.data : undefined,
        })),
    );

    return () => {
      isCancelled = true;
    };
    // fetcher пересоздаётся на каждом рендере — перезапрос управляется только ключом и версией
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  // Во время перезагрузки оставляем прошлые данные, чтобы экран не мигал
  const isSameQuery = key !== null && result?.key === key;
  const isFresh = isSameQuery && result.version === version;

  return {
    data: isSameQuery ? result.data : undefined,
    error: isFresh ? result.error : undefined,
    isLoading: key !== null && !isFresh,
    reload,
  };
}
