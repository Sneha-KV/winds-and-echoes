/**
 * screens/Publish.jsx
 *
 * Final publishing screen. Author sets URL slug, SEO meta, tags,
 * reviews social captions, and publishes to Ghost (live or draft).
 *
 * Props:
 *   postData  {object}   - approved post data from Review screen
 *   onDone    {Function} - called after successful publish, returns to Dashboard
 *   onBack    {Function} - go back to Review
 *   showToast {Function} - (message, type) => void
 */

import { useState } from 'react';

// ── Social caption editor ─────────────────────────────────────────────────
function SocialCaptions({ captions, onChange }) {
  const [open, setOpen] = useState(false);
  if (!captions) return null;

  return (
    <div className="social-section">
      <button className="social-toggle" onClick={() => setOpen(!open)}>
        <span className="social-toggle-label">Social captions</span>
        <span className="social-toggle-count">3 generated</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="social-body">
          {[
            { key: 'instagram', label: 'Instagram', icon: '📸' },
            { key: 'twitter',   label: 'X / Twitter', icon: '𝕏' },
            { key: 'pinterest', label: 'Pinterest',  icon: '📌' },
          ].map(({ key, label, icon }) => (
            <div key={key} className="social-caption-field">
              <div className="social-caption-label">{icon} {label}</div>
              <textarea
                className="social-caption-input"
                value={captions[key] || ''}
                onChange={e => onChange({ ...captions, [key]: e.target.value })}
                rows={3}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Confirm modal ─────────────────────────────────────────────────────────
function ConfirmModal({ slug, onConfirm, onClose, publishing }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">Ready to publish?</h2>
        <p className="modal-sub">
          Your post will go live at:
        </p>
        <div className="confirm-url">
          windsandechoes.com/{slug}
        </div>
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose} disabled={publishing}>
            Cancel
          </button>
          <button className="modal-publish" onClick={onConfirm} disabled={publishing}>
            {publishing ? 'Publishing…' : 'Publish now →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Publish screen ───────────────────────────────────────────────────
export default function Publish({ postData, onDone, onBack }) {
  const [metaTitle, setMetaTitle] = useState(postData?.metaTitle || postData?.title || '');
  const [metaDesc, setMetaDesc] = useState(postData?.metaDescription || '');
  const [slug, setSlug] = useState(
    (postData?.title || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  );
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [captions, setCaptions] = useState(postData?.pipelineResult?.socialCaptions || null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [published, setPublished] = useState(false);

  function handleSlug(e) {
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
  }

  function addTag(e) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,$/, '');
      if (!tags.includes(tag)) setTags([...tags, tag]);
      setTagInput('');
    }
  }

  function removeTag(tag) {
    setTags(tags.filter(t => t !== tag));
  }

  async function handleSaveDraft() {
    setSavingDraft(true);
    try {
      // Using direct fetch here — see api/index.js saveGhostDraft() for the abstracted version
      const response = await fetch('/api/ghost/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postData?.title,
          content: postData?.approvedContent || postData?.content,
          metaTitle,
          metaDescription: metaDesc,
          slug,
          tags,
          altTexts: postData?.altTexts || [],
          photos: postData?.photos || [],
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert('Saved as draft in Ghost ✓');
      }
    } catch (err) {
      alert('Failed to save draft: ' + err.message);
    } finally {
      setSavingDraft(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      // Using direct fetch here — see api/index.js publishGhostPost() for the abstracted version
      const response = await fetch('/api/ghost/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postData?.title,
          content: postData?.approvedContent || postData?.content,
          metaTitle,
          metaDescription: metaDesc,
          slug,
          tags,
          altTexts: postData?.altTexts || [],
          photos: postData?.photos || [],
          status: 'published',
        }),
      });
      const result = await response.json();
      if (result.success) {
        setPublished(true);
        setShowConfirm(false);
      }
    } catch (err) {
      alert('Publish failed: ' + err.message);
    } finally {
      setPublishing(false);
    }
  }

  // ── Published success state ───────────────────────────────────────────
  if (published) {
    return (
      <div className="screen publish">
        <div className="publish-success">
          <div className="success-icon">◎</div>
          <h2 className="success-title">Published</h2>
          <p className="success-url">windsandechoes.com/{slug}</p>
          <a
            href={`https://windsandechoes.com/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary success-view"
          >
            View post ↗
          </a>
          <button className="btn-secondary success-back" onClick={onDone}>
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen publish">

      <header className="np-header">
        <button className="np-back" onClick={onBack}>←</button>
        <span className="np-title">Publish</span>
        <div />
      </header>

      <div className="publish-body">

        {/* Post preview */}
        <div className="publish-preview">
          {postData?.photos?.[0]?.preview && (
            <img
              src={postData.photos[0].preview}
              alt="Hero"
              className="preview-hero"
            />
          )}
          <div className="preview-content">
            <h2 className="preview-title">{postData?.title || 'Untitled'}</h2>
            <p className="preview-excerpt">
              {(postData?.approvedContent || postData?.content || '')
                .substring(0, 200)
                .trim()}…
            </p>
          </div>
        </div>

        {/* URL slug */}
        <div className="publish-section">
          <div className="publish-section-label">Post URL</div>
          <div className="slug-wrap">
            <span className="slug-prefix">windsandechoes.com/</span>
            <input
              className="slug-input"
              value={slug}
              onChange={handleSlug}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Meta fields */}
        <div className="publish-section">
          <div className="publish-section-label">SEO meta title</div>
          <input
            className="publish-input"
            value={metaTitle}
            onChange={e => setMetaTitle(e.target.value)}
            placeholder="Meta title…"
            maxLength={60}
          />
          <div className="char-count">{metaTitle.length}/60</div>
        </div>

        <div className="publish-section">
          <div className="publish-section-label">SEO meta description</div>
          <textarea
            className="publish-textarea"
            value={metaDesc}
            onChange={e => setMetaDesc(e.target.value)}
            placeholder="Meta description…"
            maxLength={160}
            rows={3}
          />
          <div className="char-count">{metaDesc.length}/160</div>
        </div>

        {/* Tags */}
        <div className="publish-section">
          <div className="publish-section-label">Tags</div>
          <div className="tags-wrap">
            {tags.map(tag => (
              <span key={tag} className="tag-pill">
                {tag}
                <button className="tag-remove" onClick={() => removeTag(tag)}>×</button>
              </span>
            ))}
            <input
              className="tag-input"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Add tag, press Enter…"
            />
          </div>
        </div>

        {/* Alt texts summary */}
        {postData?.altTexts?.length > 0 && (
          <div className="publish-section">
            <div className="publish-section-label">
              Alt text — {postData.altTexts.length} photo{postData.altTexts.length !== 1 ? 's' : ''}
            </div>
            {postData.altTexts.map((a, i) => (
              <div key={i} className="alt-text-row">
                <span className="alt-text-filename">{a.filename}</span>
                <span className="alt-text-value">{a.altText}</span>
              </div>
            ))}
          </div>
        )}

        {/* Social captions */}
        <SocialCaptions captions={captions} onChange={setCaptions} />

      </div>

      {/* Footer */}
      <div className="publish-footer">
        <button
          className="btn-secondary"
          onClick={handleSaveDraft}
          disabled={savingDraft}
        >
          {savingDraft ? 'Saving…' : 'Save draft'}
        </button>
        <button
          className="btn-primary"
          onClick={() => setShowConfirm(true)}
        >
          Publish now →
        </button>
      </div>

      {showConfirm && (
        <ConfirmModal
          slug={slug}
          onConfirm={handlePublish}
          onClose={() => setShowConfirm(false)}
          publishing={publishing}
        />
      )}

    </div>
  );
}
