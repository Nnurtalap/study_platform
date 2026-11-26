import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useUser } from '@/components/app/session';
import {
  forgetId,
  isStorageAvailable,
  readRecentIds,
  RECENT_CHANGE_EVENT,
  rememberId,
  type RecentKind,
} from '@/lib/recentIds';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(RECENT_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(RECENT_CHANGE_EVENT, onChange);
  };
}

const EMPTY: number[] = [];

// Проба хранилища пишет и удаляет ключ, поэтому делаем её один раз на вкладку,
// а не на каждый рендер
let storageProbe: boolean | null = null;

function storageWorks(): boolean {
  if (typeof window === 'undefined') return false;
  storageProbe ??= isStorageAvailable();
  return storageProbe;
}

// Снимок — сырая строка из хранилища: ссылочно стабильна, пока значение не менялось
function rawSnapshot(userId: number, kind: RecentKind): string | null {
  try {
    return localStorage.getItem(`teacher:${userId}:${kind}`);
  } catch {
    return null;
  }
}

// Хук сам берёт id пользователя, поэтому про привязку нельзя забыть на вызове
export function useRecentIds(kind: RecentKind) {
  const user = useUser();

  const snapshot = useSyncExternalStore(
    subscribe,
    () => rawSnapshot(user.id, kind),
    () => null,
  );

  const ids = useMemo(
    () => (snapshot === null ? EMPTY : readRecentIds(user.id, kind)),
    // snapshot — это та самая сырая строка, по её смене список и пересобирается
    [snapshot, user.id, kind],
  );

  const remember = useCallback(
    (id: number) => rememberId(user.id, kind, id),
    [user.id, kind],
  );

  const forget = useCallback((id: number) => forgetId(user.id, kind, id), [user.id, kind]);

  return { ids, remember, forget, isPersistent: storageWorks() };
}
