import { useState, useEffect, useRef, useCallback } from 'react';
import { getAllDrafts, deleteDraft } from '../lib/storage.js';

const STATUS_CONFIG = {
  draft:            { label: 'Draft',        color: '#8B7355' },
  pipeline_pending: { label: 'In Pipeline',  color: '#4A7C59' },
  review:           { label: 'Needs Review', color: '#C17E3A' },
  approved:         { label: 'Ready',        color: '#2C5F2E' },
  published:        { label: 'Published',    color: '#1A3A1B' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ── Swipe to delete ───────────────────────────────────────────────────────
function SwipeCard({ draft, onOpen, onDelete, onAction }) {
  const cardRef = useRef(null);
  const wrapRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const dragging = useRef(false);
  const THRESHOLD = 80;

  const onStart = useCallback((e) => {
    startX.current = e.touches ? e.touches[0].clientX : e.clientX;
    dragging.current = true;
    if (cardRef.current) cardRef.current.style.transition = 'none';
  }, []);

  const onMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = (e.touches ? e.touches[0].clientX : e.clientX) - startX.current;
    currentX.current = Math.min(0, dx);
    if (cardRef.current) cardRef.current.style.transform = `translateX(${currentX.current}px)`;
  }, []);

  const onEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    if (cardRef.current) cardRef.current.style.transition = 'transform 0.25s ease';
    if (currentX.current < -THRESHOLD) {
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(-110%)';
        cardRef.current.style.opacity = '0';
      }
      setTimeout(() => onDelete(draft.id), 260);
    } else {
      if (cardRef.current) cardRef.current.style.transform = 'translateX(0)';
    }
    currentX.current = 0;
  }, [draft.id, onDelete]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    card.addEventListener('touchstart', onStart, { passive: true });
    card.addEventListener('touchmove', onMove, { passive: true });
    card.addEventListener('touchend', onEnd);
    card.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    return () => {
      card.removeEventListener('touchstart', onStart);
      card.removeEventListener('touchmove', onMove);
      card.removeEventListener('touchend', onEnd);
      card.removeEventListener('mousedown', onStart);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
    };
  }, [onStart, onMove, onEnd]);

  const status = STATUS_CONFIG[draft.status || 'draft'];
  const wordCount = draft.content ? draft.content.split(/\s+/).filter(Boolean).length : 0;
  const photoCount = draft.photos?.length || 0;
  const isPublished = draft.status === 'published';

  return (
    <div className="swipe-wrap" ref={wrapRef}>
      <div className="delete-bg"><span className="delete-bg-label">Delete</span></div>
      <div
        className={`card ${isPublished ? 'card-published' : ''}`}
        ref={cardRef}
        onClick={() => onOpen(draft)}
      >
        <div className="card-hd">
          <div className="card-status" style={{ color: status.color }}>
            <span className="dot" style={{ background: status.color }} />
            {status.label}
          </div>
          <span className="card-time">{timeAgo(draft.updatedAt)}</span>
        </div>

        <h3 className="card-title">{draft.title || 'Untitled draft'}</h3>

        {draft.content && (
          <p className="card-excerpt">
            {draft.content.substring(0, 130).trim()}
            {draft.content.length > 130 ? '…' : ''}
          </p>
        )}

        <div className="pills">
          {wordCount > 0 && <span className="pill">{wordCount} words</span>}
          {photoCount > 0 && <span className="pill">{photoCount} photo{photoCount !== 1 ? 's' : ''}</span>}
          {draft.seoKeyword && <span className="pill pill-seo">⌖ {draft.seoKeyword}</span>}
        </div>

        <div className="quick-actions" onClick={e => e.stopPropagation()}>
          {draft.status === 'review' && <>
            <button className="qa-btn amber" onClick={() => onAction('pipeline', draft)}>▷ Run pipeline</button>
            <button className="qa-btn primary" onClick={() => onAction('review', draft)}>Review edits →</button>
          </>}
          {(draft.status === 'draft' || !draft.status) && <>
            <button className="qa-btn" onClick={() => onAction('write', draft)}>✏ Continue writing</button>
            <button className="qa-btn amber" onClick={() => onAction('pipeline', draft)}>▷ Run pipeline</button>
          </>}
          {draft.status === 'approved' && <>
            <button className="qa-btn primary" onClick={() => onAction('publish', draft)}>⬆ Publish →</button>
          </>}
          {draft.status === 'published' && <>
            <button className="qa-btn" onClick={() => onAction('publish', draft)}>⬆ Update URL</button>
          </>}
        </div>
      </div>
    </div>
  );
}

// ── Slug modal ────────────────────────────────────────────────────────────
function SlugModal({ draft, onConfirm, onClose }) {
  const [slug, setSlug] = useState(
    draft?.title
      ? draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : ''
  );

  function handleSlugChange(e) {
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">Set post URL</h2>
        <p className="modal-sub">Choose a clean, readable path before this post goes live.</p>
        <div className="slug-label">Post path</div>
        <div className="slug-wrap">
          <span className="slug-prefix">windsandechoes.com/</span>
          <input
            className="slug-input"
            value={slug}
            onChange={handleSlugChange}
            spellCheck={false}
            autoFocus
          />
        </div>
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Cancel</button>
          <button className="modal-publish" onClick={() => onConfirm(slug)}>Publish →</button>
        </div>
      </div>
    </div>
  );
}

// ── Offline banner ────────────────────────────────────────────────────────
function OfflineBanner({ queueCount }) {
  if (navigator.onLine && queueCount === 0) return null;
  return (
    <div className="offline-banner">
      <span className="offline-dot" />
      <span>Working offline — changes saved locally</span>
      {queueCount > 0 && <span className="offline-right">{queueCount} queued</span>}
    </div>
  );
}

// ── Sync bar ──────────────────────────────────────────────────────────────
function SyncBar({ lastSynced, onSync, syncing }) {
  return (
    <div className="sync-bar">
      <span className="sync-text">
        {syncing ? 'Syncing…' : lastSynced ? `Last synced ${timeAgo(lastSynced)}` : 'Not yet synced'}
      </span>
      <button className="sync-btn" onClick={onSync} disabled={syncing}>
        <span className={syncing ? 'syncing' : ''}>↻</span> {syncing ? 'Syncing' : 'Sync'}
      </button>
    </div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────
function StatsBar({ drafts }) {
  const counts = drafts.reduce((acc, d) => {
    const s = d.status || 'draft';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  return (
    <div className="stats-bar">
      <div className="stat"><span className="stat-num">{drafts.length}</span><span className="stat-label">total</span></div>
      <div className="stat-divider" />
      <div className="stat"><span className="stat-num">{counts.draft || 0}</span><span className="stat-label">drafts</span></div>
      <div className="stat-divider" />
      <div className="stat"><span className="stat-num">{counts.review || 0}</span><span className="stat-label">review</span></div>
      <div className="stat-divider" />
      <div className="stat"><span className="stat-num">{counts.published || 0}</span><span className="stat-label">published</span></div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────
export default function Dashboard({ onNewPost, onOpenDraft, onAction }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [slugDraft, setSlugDraft] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Pull to refresh
  const listRef = useRef(null);
  const ptrRef = useRef(null);
  const ptrStartY = useRef(0);
  const ptrDragging = useRef(false);

  useEffect(() => {
    loadDrafts();
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  async function loadDrafts() {
    try {
      const all = await getAllDrafts();
      setDrafts(all);
    } catch (err) {
      console.error('Failed to load drafts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    await deleteDraft(id);
    setDrafts(prev => prev.filter(d => d.id !== id));
  }

  async function handleSync() {
    setSyncing(true);
    await new Promise(r => setTimeout(r, 1200)); // replace with real sync
    await loadDrafts();
    setSyncing(false);
    setLastSynced(new Date().toISOString());
  }

  function handleAction(action, draft) {
    if (action === 'publish') {
      setSlugDraft(draft);
      return;
    }
    onAction?.(action, draft);
  }

  async function handlePublish(slug) {
    console.log('Publishing', slugDraft?.title, 'at slug:', slug);
    setSlugDraft(null);
    // TODO: call Ghost Admin API to publish with slug
  }

  const filtered = filter === 'all' ? drafts : drafts.filter(d => (d.status || 'draft') === filter);

  return (
    <div className="screen dashboard">
      {!isOnline && <OfflineBanner queueCount={0} />}

      <header className="dashboard-header">
        <div className="header-brand">
          <span className="brand-mark">W&amp;E</span>
          <div className="brand-text">
            <span className="brand-name">Winds &amp; Echoes</span>
            <span className="brand-sub">Author dashboard</span>
          </div>
        </div>
        <button className="btn-new-post" onClick={onNewPost}>
          <span className="plus">+</span> New post
        </button>
      </header>

      <SyncBar lastSynced={lastSynced} onSync={handleSync} syncing={syncing} />

      {loading ? (
        <div className="loading-state"><div className="loading-spinner" /></div>
      ) : drafts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◎</div>
          <h2>No drafts yet</h2>
          <p>Start your first adventure post</p>
          <button className="btn-primary" onClick={onNewPost}>New post</button>
        </div>
      ) : (
        <>
          <StatsBar drafts={drafts} />

          <div className="filter-tabs">
            {['all', 'draft', 'review', 'approved', 'published'].map(f => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label || f}
                {f !== 'all' && (
                  <span className="filter-count">
                    {drafts.filter(d => (d.status || 'draft') === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="ptr-hint" ref={ptrRef}>
            <span>↓ Pull to refresh</span>
          </div>

          <div className="draft-list" ref={listRef}>
            {filtered.length === 0 ? (
              <div className="empty-filter">No {filter} posts</div>
            ) : (
              filtered.map(draft => (
                <SwipeCard
                  key={draft.id}
                  draft={draft}
                  onOpen={onOpenDraft || (() => {})}
                  onDelete={handleDelete}
                  onAction={handleAction}
                />
              ))
            )}
          </div>
        </>
      )}

      {slugDraft && (
        <SlugModal
          draft={slugDraft}
          onConfirm={handlePublish}
          onClose={() => setSlugDraft(null)}
        />
      )}
    </div>
  );
}
