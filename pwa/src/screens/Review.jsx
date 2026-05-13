/**
 * screens/Review.jsx
 *
 * Diff viewer screen. Author reviews Claude's edits paragraph by paragraph,
 * accepting, rejecting, or manually editing each changed section.
 *
 * Props:
 *   postData  {object}   - post data including pipelineResult with diff array
 *   onApprove {Function} - (approvedData) => void — proceed to Publish
 *   onBack    {Function} - go back to PipelineOptions
 */

import { useState, useEffect } from 'react';

// ── Format suggestion card ────────────────────────────────────────────────
function FormatSuggestion({ suggestion, onAccept, onIgnore }) {
  if (!suggestion) return null;
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="format-card">
      <div className="format-card-header">
        <span className="format-card-label">Format suggestion</span>
        <span className="format-badge">{suggestion.format}</span>
      </div>
      <p className="format-reasoning">{suggestion.reasoning}</p>
      {suggestion.suggestedStructure?.length > 0 && (
        <div className="format-structure">
          {suggestion.suggestedStructure.map((h, i) => (
            <span key={i} className="format-heading">
              {i + 1}. {h}
            </span>
          ))}
        </div>
      )}
      <div className="format-actions">
        <button className="qa-btn" onClick={() => { setDismissed(true); onIgnore?.(); }}>
          Ignore
        </button>
        <button className="qa-btn primary" onClick={() => { setDismissed(true); onAccept?.(suggestion); }}>
          Apply structure
        </button>
      </div>
    </div>
  );
}

// ── SEO brief card ────────────────────────────────────────────────────────
function SeoBrief({ brief }) {
  const [open, setOpen] = useState(false);
  if (!brief) return null;

  return (
    <div className="seo-brief-card">
      <button className="seo-brief-toggle" onClick={() => setOpen(!open)}>
        <span className="seo-brief-label">SEO brief</span>
        <span className="seo-brief-keyword">{brief.primaryKeyword}</span>
        <span className="seo-brief-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="seo-brief-body">
          {brief.contentGaps?.length > 0 && (
            <div className="brief-section">
              <div className="brief-section-label">Content gaps to cover</div>
              {brief.contentGaps.map((g, i) => (
                <div key={i} className="brief-gap">• {g}</div>
              ))}
            </div>
          )}
          {brief.relatedKeywords?.length > 0 && (
            <div className="brief-section">
              <div className="brief-section-label">Related keywords</div>
              <div className="brief-keywords">
                {brief.relatedKeywords.map((k, i) => (
                  <span key={i} className="brief-keyword-pill">{k}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Diff paragraph ────────────────────────────────────────────────────────
function DiffParagraph({ item, onAccept, onReject, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.edited);
  const [decision, setDecision] = useState(item.decision || null);

  if (!item.changed) {
    return (
      <div className="diff-para diff-unchanged">
        <p className="diff-text">{item.original}</p>
        <span className="diff-no-change">No changes</span>
      </div>
    );
  }

  function handleAccept() {
    setDecision('accepted');
    onAccept(item.index, item.edited);
  }

  function handleReject() {
    setDecision('rejected');
    onReject(item.index, item.original);
  }

  function handleEditSave() {
    setDecision('edited');
    setEditing(false);
    onEdit(item.index, editValue);
  }

  return (
    <div className={`diff-para ${decision ? `diff-${decision}` : 'diff-pending'}`}>
      <div className="diff-versions">
        <div className="diff-version diff-original">
          <span className="diff-version-label">Original</span>
          <p className="diff-text">{item.original}</p>
        </div>
        {!editing && (
          <div className="diff-version diff-edited">
            <span className="diff-version-label">Claude's edit</span>
            <p className="diff-text">{item.edited}</p>
          </div>
        )}
        {editing && (
          <div className="diff-version diff-editing">
            <span className="diff-version-label">Your version</span>
            <textarea
              className="diff-edit-input"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              rows={4}
              autoFocus
            />
            <div className="diff-edit-actions">
              <button className="qa-btn" onClick={() => setEditing(false)}>Cancel</button>
              <button className="qa-btn primary" onClick={handleEditSave}>Save</button>
            </div>
          </div>
        )}
      </div>

      {!decision && !editing && (
        <div className="diff-actions">
          <button className="diff-btn diff-reject" onClick={handleReject}>✕ Reject</button>
          <button className="diff-btn diff-edit-btn" onClick={() => setEditing(true)}>✎ Edit</button>
          <button className="diff-btn diff-accept" onClick={handleAccept}>✓ Accept</button>
        </div>
      )}

      {decision && (
        <div className="diff-decided">
          <span className={`diff-decision-badge diff-decision-${decision}`}>
            {decision === 'accepted' ? '✓ Accepted' : decision === 'rejected' ? '✕ Rejected' : '✎ Edited'}
          </span>
          <button
            className="diff-undo"
            onClick={() => setDecision(null)}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

// ── Summary bar ───────────────────────────────────────────────────────────
function SummaryBar({ decisions }) {
  const accepted = decisions.filter(d => d === 'accepted').length;
  const rejected = decisions.filter(d => d === 'rejected').length;
  const edited = decisions.filter(d => d === 'edited').length;
  const pending = decisions.filter(d => !d).length;

  return (
    <div className="summary-bar">
      <span className="summary-item summary-accepted">✓ {accepted}</span>
      <span className="summary-item summary-rejected">✕ {rejected}</span>
      <span className="summary-item summary-edited">✎ {edited}</span>
      {pending > 0 && <span className="summary-item summary-pending">{pending} remaining</span>}
    </div>
  );
}

// ── Main Review screen ────────────────────────────────────────────────────
export default function Review({ postData, onApprove, onBack }) {
  const result = postData?.pipelineResult;
  const diff = result?.diff || [];
  const [decisions, setDecisions] = useState(diff.map(() => null));
  const [finalParas, setFinalParas] = useState(diff.map(d => d.edited || d.original));

  const changedCount = diff.filter(d => d.changed).length;
  const reviewedCount = decisions.filter(d => d !== null).length;
  const allReviewed = changedCount === 0 || reviewedCount >= changedCount;

  function acceptAll() {
    setDecisions(diff.map(d => d.changed ? 'accepted' : null));
    setFinalParas(diff.map(d => d.edited || d.original));
  }

  function handleAccept(index, text) {
    const d = [...decisions]; d[index] = 'accepted'; setDecisions(d);
    const p = [...finalParas]; p[index] = text; setFinalParas(p);
  }

  function handleReject(index, text) {
    const d = [...decisions]; d[index] = 'rejected'; setDecisions(d);
    const p = [...finalParas]; p[index] = text; setFinalParas(p);
  }

  function handleEdit(index, text) {
    const d = [...decisions]; d[index] = 'edited'; setDecisions(d);
    const p = [...finalParas]; p[index] = text; setFinalParas(p);
  }

  function handleApprove() {
    const finalContent = finalParas.join('\n\n');
    onApprove({
      ...postData,
      approvedContent: finalContent,
      metaTitle: result?.metaTitle,
      metaDescription: result?.metaDescription,
      altTexts: result?.altTexts || [],
      formatSuggestion: result?.formatSuggestion,
    });
  }

  // If no pipeline result, pass through directly
  if (!result || diff.length === 0) {
    return (
      <div className="screen review">
        <header className="review-header">
          <button className="np-back" onClick={onBack}>←</button>
          <span className="np-title">Review</span>
          <div />
        </header>
        <div className="review-empty">
          <p>No AI edits to review.</p>
          <button className="btn-primary" onClick={() => onApprove(postData)}>
            Continue to publish →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen review">
      <header className="review-header">
        <button className="np-back" onClick={onBack}>←</button>
        <div className="review-header-center">
          <span className="np-title">Review edits</span>
          <span className="review-progress">
            {reviewedCount} of {changedCount} reviewed
          </span>
        </div>
        <button className="accept-all-btn" onClick={acceptAll}>Accept all</button>
      </header>

      <div className="review-body">

        {result?.formatSuggestion && (
          <FormatSuggestion suggestion={result.formatSuggestion} />
        )}

        {result?.seoBrief && (
          <SeoBrief brief={result.seoBrief} />
        )}

        {result?.metaTitle && (
          <div className="meta-preview">
            <div className="meta-preview-label">SEO meta</div>
            <div className="meta-preview-title">{result.metaTitle}</div>
            <div className="meta-preview-desc">{result.metaDescription}</div>
          </div>
        )}

        <div className="diff-list">
          {diff.map((item, i) => (
            <DiffParagraph
              key={i}
              item={item}
              onAccept={handleAccept}
              onReject={handleReject}
              onEdit={handleEdit}
            />
          ))}
        </div>

      </div>

      <div className="review-footer">
        <SummaryBar decisions={decisions} />
        <button
          className="btn-primary"
          onClick={handleApprove}
          disabled={!allReviewed}
        >
          Approve & continue →
        </button>
      </div>
    </div>
  );
}
