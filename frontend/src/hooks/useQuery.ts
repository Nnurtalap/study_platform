import { useCallback, useEffect, useState } from 'react';

type Result<T> = { key: string; data?: T; error?: unknown };

// Минимальная загрузка данных: результат привязан к ключу, поэтому при смене ключа
// старые данные не показываются, а состояние загрузки выводится без лишних setState.
export function useQuery<T>(key: string | null, fetcher: () => Promise<T>) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const fullKey = key === null ? null : `${key}#${version}`;

  useEffect(() => {
    if (fullKey === null) return;
    let isCancelled = false;

    fetcher().then(
      (data) => !isCancelled && setResult({ key: fullKey, data }),
      (error: unknown) => !isCancelled && setResult({ key: fullKey, error }),
    );

    return () => {
      isCancelled = true;
    };
    // fetcher пересоздаётся на каждом рендере — перезапрос управляется только ключом
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  // Во время перезагрузки оставляем прошлые данные, чтобы экран не мигал
  const isFresh = result !== null && result.key === fullKey;
  const isSameQuery = result !== null && key !== null && result.key.startsWith(`${key}#`);

  return {
    data: isSameQuery ? result.data : undefined,
    error: isFresh ? result.error : undefined,
    isLoading: fullKey !== null && !isFresh,
    reload,
  };
}
