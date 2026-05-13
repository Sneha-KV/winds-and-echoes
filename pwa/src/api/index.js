/**
 * api/index.js
 *
 * Centralised API layer. All fetch calls go through here.
 * Components never call fetch() directly — they use these functions.
 *
 * Benefits:
 * - Single place to update base URL or add auth headers
 * - Consistent error handling
 * - Easy to mock in tests
 */

const BASE_URL = import.meta.env.VITE_PIPELINE_URL || '/api';

/**
 * Base fetch wrapper with consistent error handling.
 * @param {string} path - API path (e.g. '/pipeline')
 * @param {object} options - fetch options
 * @returns {Promise<object>} - parsed JSON response
 * @throws {Error} - with message from server or network error
 */
async function apiFetch(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

// ── Pipeline ──────────────────────────────────────────────────────────────

/**
 * Run the AI pipeline for a post.
 * @param {object} params
 * @param {string}   params.draft      - raw draft text
 * @param {Array}    params.photos     - processed photo objects
 * @param {object}   params.toggles   - which pipeline steps to run
 * @param {string}  [params.seoKeyword] - optional SEO keyword for pre-brief
 * @returns {Promise<object>} pipeline result
 */
export async function runPipeline({ draft, photos, toggles, seoKeyword }) {
  return apiFetch('/pipeline', {
    method: 'POST',
    body: JSON.stringify({ draft, photos, toggles, seoKeyword }),
  });
}

// ── Ghost ─────────────────────────────────────────────────────────────────

/**
 * Save a post as a draft in Ghost.
 * @param {object} postPayload - title, content, meta, tags, slug, altTexts
 * @returns {Promise<object>} created Ghost post
 */
export async function saveGhostDraft(postPayload) {
  return apiFetch('/ghost/draft', {
    method: 'POST',
    body: JSON.stringify(postPayload),
  });
}

/**
 * Publish a post live in Ghost.
 * @param {object} postPayload - title, content, meta, tags, slug, altTexts, status='published'
 * @returns {Promise<object>} published Ghost post
 */
export async function publishGhostPost(postPayload) {
  return apiFetch('/ghost/publish', {
    method: 'POST',
    body: JSON.stringify({ ...postPayload, status: 'published' }),
  });
}

// ── Health ────────────────────────────────────────────────────────────────

/**
 * Check pipeline server health.
 * @returns {Promise<object>} { status: 'ok', service: '...' }
 */
export async function checkHealth() {
  return apiFetch('/health');
}
