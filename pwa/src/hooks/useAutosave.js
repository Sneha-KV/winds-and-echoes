/**
 * hooks/useAutosave.js
 *
 * Debounced autosave hook. Saves draft to IndexedDB after a delay
 * whenever the watched values change. Returns save status.
 *
 * Usage:
 *   const { saveStatus, forceSave } = useAutosave({ title, content, photos, seoKeyword }, draftId, setDraftId);
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { saveDraft } from '../lib/storage.js';
import { AUTOSAVE_DELAY } from '../constants/index.js';

/**
 * @param {object} data     - values to watch and save { title, content, photos, seoKeyword }
 * @param {number} draftId  - existing draft ID (null for new drafts)
 * @param {Function} setDraftId - called with new ID after first save
 * @returns {{ saveStatus: string, forceSave: Function }}
 */
export function useAutosave(data, draftId, setDraftId) {
  const [saveStatus, setSaveStatus] = useState('saved');
  const timerRef = useRef(null);
  const idRef = useRef(draftId);

  // Keep idRef in sync so the save callback always uses the latest ID
  useEffect(() => { idRef.current = draftId; }, [draftId]);

  const doSave = useCallback(async (saveData) => {
    setSaveStatus('saving');
    try {
      const saved = await saveDraft({
        id: idRef.current || undefined,
        ...saveData,
        // Don't store File objects in IndexedDB — store metadata only
        photos: (saveData.photos || []).map(p => ({
          id: p.id,
          name: p.name,
          preview: p.preview, // object URL — only valid this session
        })),
        status: 'draft',
      });
      if (!idRef.current && saved) {
        idRef.current = saved;
        setDraftId(saved);
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('[useAutosave] save failed:', err);
      setSaveStatus('error');
    }
  }, [setDraftId]);

  // Watch data and schedule autosave
  useEffect(() => {
    setSaveStatus('unsaved');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSave(data), AUTOSAVE_DELAY);
    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.title, data.content, data.seoKeyword, data.photos?.length]);

  // Force immediate save (e.g. on screen transition)
  const forceSave = useCallback(() => {
    clearTimeout(timerRef.current);
    return doSave(data);
  }, [doSave, data]);

  return { saveStatus, forceSave };
}
