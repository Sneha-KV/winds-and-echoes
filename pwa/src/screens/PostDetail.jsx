/**
 * screens/PostDetail.jsx
 *
 * View an existing draft or published post.
 * Shows current status, content preview, photo grid,
 * version history, and context-aware action buttons.
 *
 * Props:
 *   draft    {object}   - the draft object from IndexedDB
 *   onEdit   {Function} - navigate to NewPost with this draft pre-loaded
 *   onAction {Function} - (action, draft) => void — 'pipeline' | 'review' | 'publish'
 *   onBack   {Function} - navigate back to Dashboard
 */

import { useState } from 'react';
import { StatusBadge, BottomSheet } from '../components/index.jsx';
import { BLOG_DOMAIN, STATUS } from '../constants/index.js';

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function wordCount(text) {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

// ── Photo grid ────────────────────────────────────────────────────────────

/**
 * Displays a horizontal scrolling grid of attached photos.
 * @param {Array} photos - array of { id, name, preview }
 */
function PhotoGrid({ photos }) {
  if (!photos?.length) return null;
  return (
    <div className="detail-section">
      <div className="detail-section-label">
        Photos ({photos.length})
      </div>
      <div className="detail-photo-grid">
        {photos.map((photo, i) => (
          <div key={photo.id} className="detail-photo-thumb">
            {photo.preview
              ? <img src={photo.preview} alt={photo.name} />
              : <div className="detail-photo-placeholder">{photo.name}</div>
            }
            {i === 0 && <span className="hero-badge">Hero</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Version history ───────────────────────────────────────────────────────

/**
 * Collapsible section showing all saved versions of the draft.
 * Versions are stored as an array in draft.versions from the pipeline.
 *
 * @param {Array} versions - [{ label, content, savedAt }]
 */
function VersionHistory({ versions }) {
  const [open, setOpen] = useState(false);
  const [viewingVersion, setViewingVersion] = useState(null);

  if (!versions?.length) return null;

  return (
    <div className="detail-section">
      <button
        className="version-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="detail-section-label">Version history</span>
        <span className="version-count">{versions.length} versions</span>
        <span className="version-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="version-list">
          {versions.map((v, i) => (
            <div key={i} className="version-row">
              <div className="version-info">
                <span className="version-label">{v.label}</span>
                <span className="version-date">{formatDate(v.savedAt)}</span>
              </div>
              <button
                className="version-view-btn"
                onClick={() => setViewingVersion(v)}
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}

      {viewingVersion && (
        <BottomSheet
          title={viewingVersion.label}
          onClose={() => setViewingVersion(null)}
        >
          <div className="version-content-preview">
            {viewingVersion.content}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

// ── Action bar ────────────────────────────────────────────────────────────

/**
 * Fixed bottom action bar. Buttons shown depend on post status.
 *
 * @param {string}   status
 * @param {string}   slug    - for published posts, the URL slug
 * @param {Function} onEdit
 * @param {Function} onAction
 */
function ActionBar({ status, slug, onEdit, onAction }) {
  return (
    <div className="detail-action-bar">
      {status === STATUS.DRAFT && <>
        <button className="btn-secondary detail-action" onClick={onEdit}>
          ✏ Edit post
        </button>
        <button className="btn-primary detail-action" onClick={() => onAction('pipeline')}>
          ▷ Run pipeline
        </button>
      </>}

      {status === STATUS.PIPELINE_PENDING && (
        <button className="btn-primary detail-action" disabled>
          Pipeline running…
        </button>
      )}

      {status === STATUS.REVIEW && (
        <button className="btn-primary detail-action" onClick={() => onAction('review')}>
          Review edits →
        </button>
      )}

      {status === STATUS.APPROVED && (
        <button className="btn-primary detail-action" onClick={() => onAction('publish')}>
          ⬆ Publish →
        </button>
      )}

      {status === STATUS.PUBLISHED && <>
        <a
          href={`https://${BLOG_DOMAIN}/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary detail-action"
        >
          View on blog ↗
        </a>
        <button className="btn-primary detail-action" onClick={onEdit}>
          Update post
        </button>
      </>}
    </div>
  );
}

// ── Main PostDetail screen ────────────────────────────────────────────────

export default function PostDetail({ draft, onEdit, onAction, onBack }) {
  if (!draft) {
    return (
      <div className="screen post-detail">
        <header className="np-header">
          <button className="np-back" onClick={onBack}>←</button>
          <span className="np-title">Post</span>
          <div />
        </header>
        <div className="detail-empty">Post not found.</div>
      </div>
    );
  }

  const status = draft.status || STATUS.DRAFT;
  const words = wordCount(draft.content);
  const slug = draft.slug || (draft.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return (
    <div className="screen post-detail">

      {/* Header */}
      <header className="np-header">
        <button className="np-back" onClick={onBack} aria-label="Back">←</button>
        <span className="np-title">Post</span>
        {status === STATUS.DRAFT && (
          <button className="detail-edit-btn" onClick={onEdit}>Edit</button>
        )}
      </header>

      <div className="detail-body">

        {/* Status + title */}
        <div className="detail-hero">
          <StatusBadge status={status} />
          <h1 className="detail-title">{draft.title || 'Untitled draft'}</h1>
        </div>

        {/* Meta row */}
        <div className="detail-meta-row">
          {words > 0 && (
            <span className="detail-meta-item">{words} words</span>
          )}
          {draft.photos?.length > 0 && (
            <span className="detail-meta-item">{draft.photos.length} photos</span>
          )}
          {draft.seoKeyword && (
            <span className="detail-meta-item pill-seo">⌖ {draft.seoKeyword}</span>
          )}
          <span className="detail-meta-item detail-meta-date">
            Updated {formatDate(draft.updatedAt)}
          </span>
        </div>

        {/* Published URL */}
        {status === STATUS.PUBLISHED && (
          <div className="detail-section">
            <div className="detail-section-label">Live URL</div>
            <a
              className="detail-url"
              href={`https://${BLOG_DOMAIN}/${slug}`}
              target="_blank"
              rel="noreferrer"
            >
              {BLOG_DOMAIN}/{slug} ↗
            </a>
          </div>
        )}

        {/* Content preview */}
        {draft.content && (
          <div className="detail-section">
            <div className="detail-section-label">Content preview</div>
            <div className="detail-content-preview">
              {draft.content}
            </div>
          </div>
        )}

        {/* Photos */}
        <PhotoGrid photos={draft.photos} />

        {/* Alt texts */}
        {draft.altTexts?.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-label">Alt texts</div>
            {draft.altTexts.map((a, i) => (
              <div key={i} className="alt-text-row">
                <span className="alt-text-filename">{a.filename}</span>
                <span className="alt-text-value">{a.altText}</span>
              </div>
            ))}
          </div>
        )}

        {/* Version history */}
        <VersionHistory versions={draft.versions} />

        {/* Padding for fixed action bar */}
        <div style={{ height: 80 }} />

      </div>

      <ActionBar
        status={status}
        slug={slug}
        onEdit={onEdit}
        onAction={onAction}
      />

    </div>
  );
}
