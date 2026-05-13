/**
 * hooks/useOnlineStatus.js
 *
 * Tracks the browser's online/offline state reactively.
 * Uses the navigator.onLine API and window events.
 *
 * Usage:
 *   const isOnline = useOnlineStatus();
 */

import { useState, useEffect } from 'react';

/**
 * @returns {boolean} true if online, false if offline
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
