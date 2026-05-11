import { openDB } from 'idb';

const DB_NAME = 'winds-and-echoes';
const DB_VERSION = 1;

// Open (or create) the IndexedDB database
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Drafts store — auto-saves as author types
      if (!db.objectStoreNames.contains('drafts')) {
        const drafts = db.createObjectStore('drafts', { keyPath: 'id', autoIncrement: true });
        drafts.createIndex('updatedAt', 'updatedAt');
      }

      // Photo queue — stores photos waiting to upload when signal returns
      if (!db.objectStoreNames.contains('photoQueue')) {
        db.createObjectStore('photoQueue', { keyPath: 'id', autoIncrement: true });
      }

      // Pipeline results — cached results while offline
      if (!db.objectStoreNames.contains('pipelineResults')) {
        db.createObjectStore('pipelineResults', { keyPath: 'draftId' });
      }
    },
  });
}

// ── Drafts ────────────────────────────────────────────────────────────────

export async function saveDraft(draft) {
  const db = await getDB();
  const now = new Date().toISOString();
  if (draft.id) {
    return db.put('drafts', { ...draft, updatedAt: now });
  }
  return db.add('drafts', { ...draft, createdAt: now, updatedAt: now });
}

export async function getDraft(id) {
  const db = await getDB();
  return db.get('drafts', id);
}

export async function getAllDrafts() {
  const db = await getDB();
  const all = await db.getAll('drafts');
  return all.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export async function deleteDraft(id) {
  const db = await getDB();
  return db.delete('drafts', id);
}

// ── Photo queue ───────────────────────────────────────────────────────────

export async function queuePhoto(photo) {
  const db = await getDB();
  return db.add('photoQueue', { ...photo, queuedAt: new Date().toISOString() });
}

export async function getPhotoQueue() {
  const db = await getDB();
  return db.getAll('photoQueue');
}

export async function clearPhotoQueue() {
  const db = await getDB();
  return db.clear('photoQueue');
}

// ── Pipeline results ──────────────────────────────────────────────────────

export async function savePipelineResult(draftId, result) {
  const db = await getDB();
  return db.put('pipelineResults', { draftId, result, savedAt: new Date().toISOString() });
}

export async function getPipelineResult(draftId) {
  const db = await getDB();
  return db.get('pipelineResults', draftId);
}
