/**
 * components/index.jsx
 *
 * Shared UI components used across multiple screens.
 * Each component is focused, documented, and receives all data via props.
 *
 * Exports:
 *   OfflineBanner  — shows when device is offline
 *   ToastContainer — renders active toast notifications
 *   BottomSheet    — reusable modal bottom sheet wrapper
 *   ModelBadge     — Sonnet / Haiku pill
 *   StatusBadge    — post status pill with colour coding
 *   SaveIndicator  — autosave status label
 *   LoadingSpinner — centered loading indicator
 */

import { useEffect } from 'react';
import { STATUS_CONFIG, MODEL_CONFIG } from '../constants/index.js';

// ── OfflineBanner ─────────────────────────────────────────────────────────

/**
 * Sticky banner shown when device is offline.
 * Auto-hides when back online.
 *
 * @param {number} queueCount - number of items queued for sync
 */
export function OfflineBanner({ queueCount = 0 }) {
  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <span className="offline-dot" aria-hidden="true" />
      <span>Working offline — changes saved locally</span>
      {queueCount > 0 && (
        <span className="offline-right">{queueCount} queued</span>
      )}
    </div>
  );
}

// ── ToastContainer ────────────────────────────────────────────────────────

/**
 * Renders active toast notifications.
 * Place once in App.jsx — receives toasts from useToast hook.
 *
 * @param {Array}    toasts      - array of { id, message, type }
 * @param {Function} onDismiss  - called with toast id when dismissed
 */
export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => onDismiss(toast.id)}
          role="alert"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

// ── BottomSheet ───────────────────────────────────────────────────────────

/**
 * Reusable bottom sheet modal wrapper.
 * Closes on overlay click or Escape key.
 *
 * @param {ReactNode} children
 * @param {Function}  onClose
 * @param {string}   [title] - optional title rendered at top
 */
export function BottomSheet({ children, onClose, title }) {
  // Close on Escape key
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
    >
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" aria-hidden="true" />
        {title && <h2 className="modal-title">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

// ── ModelBadge ────────────────────────────────────────────────────────────

/**
 * Small pill indicating which Claude model handles a pipeline step.
 *
 * @param {'Sonnet'|'Haiku'|'n/a'} model
 */
export function ModelBadge({ model }) {
  if (model === 'n/a') return null;
  const config = MODEL_CONFIG[model];
  if (!config) return null;
  return (
    <span
      className="model-badge"
      style={{ color: config.color, background: config.bg }}
      title={`Handled by Claude ${model}`}
    >
      {config.label}
    </span>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────

/**
 * Coloured pill showing a post's current status.
 *
 * @param {string} status - one of STATUS constants
 */
export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span
      className="status-badge"
      style={{ color: config.color, background: config.bg }}
    >
      <span
        className="status-badge-dot"
        style={{ background: config.color }}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}

// ── SaveIndicator ─────────────────────────────────────────────────────────

/**
 * Small text indicator for autosave state.
 * Shown in the header of NewPost screen.
 *
 * @param {'saved'|'saving'|'unsaved'|'error'} status
 */
export function SaveIndicator({ status }) {
  const config = {
    saved:   { text: '✓ Saved',      color: '#4A7C59' },
    saving:  { text: 'Saving…',      color: '#8C8882' },
    unsaved: { text: 'Unsaved',      color: '#C17E3A' },
    error:   { text: 'Save failed',  color: '#8B2020' },
  };
  const c = config[status] || config.unsaved;
  return (
    <span className="save-indicator" style={{ color: c.color }} aria-live="polite">
      {c.text}
    </span>
  );
}

// ── LoadingSpinner ────────────────────────────────────────────────────────

/**
 * Centered loading spinner.
 * Used as full-screen loading state.
 */
export function LoadingSpinner() {
  return (
    <div className="loading-state" role="status" aria-label="Loading">
      <div className="loading-spinner" />
    </div>
  );
}
