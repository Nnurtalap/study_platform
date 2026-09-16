import { getAccessToken, TOKEN_CHANGE_EVENT } from '@/api/auth/token';
import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(TOKEN_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(TOKEN_CHANGE_EVENT, onChange);
  };
}

// На сервере токена нет — до гидрации показываем гостевое состояние
export function useIsSignedIn(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getAccessToken() !== null,
    () => false,
  );
}
