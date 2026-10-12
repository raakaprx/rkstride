import { useEffect, useState } from 'react';

export type OnlineStatus = boolean;

/**
 * Live connectivity for a 100% offline-first app.
 *
 * The PWA never needs the network to log a set, so this value is used for
 * honesty only: to label whether a sync actually happened. It must never gate
 * a write. `navigator.onLine` is treated as a hint, not a guarantee, because
 * a phone can hold a full signal bar with no route to the internet.
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
