import { getAccessToken } from '@/api/auth/token';
import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

// На сервере токена нет — до гидрации показываем гостевое состояние
export function useIsSignedIn(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getAccessToken() !== null,
    () => false,
  );
}
