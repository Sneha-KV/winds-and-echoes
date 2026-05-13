/**
 * hooks/useToast.js
 *
 * Lightweight toast notification system.
 * Returns { toasts, showToast } — render <ToastContainer> in App.jsx.
 *
 * Usage:
 *   const { toasts, showToast } = useToast();
 *   showToast('Draft saved', 'success');
 *   showToast('Pipeline failed', 'error');
 */

import { useState, useCallback } from 'react';

let toastId = 0;

/**
 * @returns {{ toasts: Array, showToast: Function }}
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'success'|'error'|'info'} type
   * @param {number} duration - ms before auto-dismiss (default 3000)
   */
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}
