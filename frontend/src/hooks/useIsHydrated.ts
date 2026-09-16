import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

// false на сервере и во время гидрации, true после неё
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
