/**
 * screens/NewPost.jsx
 *
 * Primary writing screen. Photo upload + text editor with autosave.
 *
 * Props:
 *   existingDraft {object}   - pre-populate from an existing draft (optional)
 *   onNext        {Function} - (postData) => void — proceed to PipelineOptions
 *   onBack        {Function} - go back to Dashboard
 *   showToast     {Function} - (message, type) => void
 */

import { useState, useEffect, useRef } from 'react';
import { useAutosave } from '../hooks/useAutosave.js';
import { SaveIndicator } from '../components/index.jsx';

// ── Photo upload ──────────────────────────────────────────────────────────
function PhotoUpload({ photos, onChange }) {
  const inputRef = useRef(null);

  function handleFiles(e) {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    onChange([...photos, ...newPhotos]);
  }

  function removePhoto(id) {
    onChange(photos.filter(p => p.id !== id));
  }

  return (
    <div className="photo-upload">
      <div className="photo-upload-header">
        <span className="photo-upload-label">Photos</span>
        {photos.length > 0 && (
          <span className="photo-count">{photos.length} attached</span>
        )}
      </div>

      <div className="photo-grid">
        {photos.map((photo, i) => (
          <div key={photo.id} className="photo-thumb">
            <img src={photo.preview} alt={photo.name} />
            {i === 0 && <span className="hero-badge">Hero</span>}
            <button
              className="photo-remove"
              onClick={() => removePhoto(photo.id)}
            >
              ×
            </button>
          </div>
        ))}

        <button
          className="photo-add-btn"
          onClick={() => inputRef.current?.click()}
        >
          <span className="photo-add-icon">+</span>
          <span className="photo-add-label">
            {photos.length === 0 ? 'Add photos' : 'Add more'}
          </span>
        </button>
      </div>

      <p className="photo-hint">
        First photo becomes the hero image. Drag to reorder.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFiles}
      />
    </div>
  );
}

// ── Word count ────────────────────────────────────────────────────────────
function wordCount(text) {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

// ── Main NewPost screen ───────────────────────────────────────────────────
export default function NewPost({ onNext, onBack, existingDraft }) {
  const [title, setTitle] = useState(existingDraft?.title || '');
  const [content, setContent] = useState(existingDraft?.content || '');
  const [photos, setPhotos] = useState(existingDraft?.photos || []);
  const [seoKeyword, setSeoKeyword] = useState(existingDraft?.seoKeyword || '');
  const [draftId, setDraftId] = useState(existingDraft?.id || null);
  const [showSeoField, setShowSeoField] = useState(!!existingDraft?.seoKeyword);
  const textareaRef = useRef(null);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // Autosave via shared hook
  const { saveStatus } = useAutosave(
    { title, content, photos, seoKeyword },
    draftId,
    setDraftId
  );

  function handleContinue() {
    if (!title.trim() && !content.trim()) return;
    onNext({
      id: draftId,
      title,
      content,
      photos,
      seoKeyword,
      status: 'draft',
    });
  }

  const canContinue = title.trim().length > 0 || content.trim().length > 0;
  const words = wordCount(content);

  return (
    <div className="screen new-post">

      {/* Header */}
      <header className="np-header">
        <button className="np-back" onClick={onBack}>←</button>
        <span className="np-title">New post</span>
        <SaveIndicator status={saveStatus} />
      </header>

      <div className="np-body">

        {/* Title */}
        <div className="np-section">
          <input
            className="np-title-input"
            type="text"
            placeholder="Post title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>

        {/* Photos */}
        <div className="np-section np-section-photos">
          <PhotoUpload photos={photos} onChange={setPhotos} />
        </div>

        {/* Editor */}
        <div className="np-section np-section-editor">
          <div className="editor-header">
            <span className="editor-label">Your draft</span>
            <span className="editor-wordcount">{words} {words === 1 ? 'word' : 'words'}</span>
          </div>
          <textarea
            ref={textareaRef}
            className="np-editor"
            placeholder="Start writing your adventure…&#10;&#10;Write naturally — Claude will polish the prose, suggest a format, and handle SEO. Your voice stays yours."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={12}
          />
        </div>

        {/* SEO keyword — optional */}
        <div className="np-section">
          {showSeoField ? (
            <div className="seo-field">
              <div className="seo-field-header">
                <span className="seo-field-label">Target keyword</span>
                <button
                  className="seo-field-remove"
                  onClick={() => { setShowSeoField(false); setSeoKeyword(''); }}
                >
                  Remove
                </button>
              </div>
              <input
                className="seo-input"
                type="text"
                placeholder="e.g. hiking the enchantments washington"
                value={seoKeyword}
                onChange={e => setSeoKeyword(e.target.value)}
              />
              <p className="seo-hint">Claude will use this to run a keyword brief and integrate SEO naturally.</p>
            </div>
          ) : (
            <button
              className="seo-add-btn"
              onClick={() => setShowSeoField(true)}
            >
              + Add target keyword
            </button>
          )}
        </div>

      </div>

      {/* Fixed bottom bar */}
      <div className="np-footer">
        <div className="np-footer-meta">
          {photos.length > 0 && (
            <span className="footer-pill">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
          )}
          {words > 0 && (
            <span className="footer-pill">{words} words</span>
          )}
        </div>
        <button
          className="btn-primary np-continue"
          onClick={handleContinue}
          disabled={!canContinue}
        >
          Continue →
        </button>
      </div>

    </div>
  );
}
