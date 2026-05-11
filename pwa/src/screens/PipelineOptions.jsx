import { useState } from 'react';

// Default toggles — matches design doc section 3.4
const DEFAULT_TOGGLES = {
  altText: true,
  editorialPass: true,
  formatSuggestion: true,
  seoIntegration: true,
  socialCaptions: false,
  seoBrief: false,
};

// Estimated token cost per toggle (rough, for display only)
const TOKEN_ESTIMATES = {
  altText: '~$0.01',
  editorialPass: '~$0.10',
  formatSuggestion: '~$0.05',
  seoIntegration: '~$0.05',
  socialCaptions: '~$0.01',
  seoBrief: '~$0.08',
};

const TOGGLE_LABELS = {
  altText: 'Alt text generation',
  editorialPass: 'Editorial pass',
  formatSuggestion: 'Format suggestion',
  seoIntegration: 'SEO integration',
  socialCaptions: 'Social captions',
  seoBrief: 'SEO pre-brief',
};

const TOGGLE_DESCRIPTIONS = {
  altText: 'Claude vision generates alt text for each photo (Haiku)',
  editorialPass: 'Polish prose, fix grammar, tighten flow (Sonnet)',
  formatSuggestion: 'Recommend best post structure (Sonnet)',
  seoIntegration: 'Weave keywords, suggest meta title + description (Sonnet)',
  socialCaptions: 'Generate IG, X, Pinterest captions on publish (Haiku)',
  seoBrief: 'Research keywords and content gaps before writing (Sonnet)',
};

export default function PipelineOptions({ postData, onNext, onBack }) {
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES);
  const [seoKeyword, setSeoKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const toggle = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft: postData.draft,
          photos: postData.photos,
          toggles,
          seoKeyword: toggles.seoBrief ? seoKeyword : null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        onNext({ pipelineResult: result, toggles });
      } else {
        alert(`Pipeline error: ${result.error}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const anyToggleOn = Object.values(toggles).some(Boolean);

  return (
    <div className="screen pipeline-options">
      <header>
        <button onClick={onBack}>← Back</button>
        <h1>Pipeline options</h1>
      </header>

      <div className="toggles">
        {Object.keys(toggles).map((key) => (
          <div key={key} className={`toggle-row ${toggles[key] ? 'on' : 'off'}`}>
            <div className="toggle-info">
              <span className="toggle-label">{TOGGLE_LABELS[key]}</span>
              <span className="toggle-desc">{TOGGLE_DESCRIPTIONS[key]}</span>
            </div>
            <div className="toggle-right">
              <span className="cost">{toggles[key] ? TOKEN_ESTIMATES[key] : '—'}</span>
              <button
                className={`toggle-btn ${toggles[key] ? 'active' : ''}`}
                onClick={() => toggle(key)}
              >
                {toggles[key] ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {toggles.seoBrief && (
        <div className="seo-keyword">
          <label>Target keyword or topic</label>
          <input
            type="text"
            value={seoKeyword}
            onChange={(e) => setSeoKeyword(e.target.value)}
            placeholder="e.g. hiking the Enchantments Washington"
          />
        </div>
      )}

      <div className="actions">
        {!anyToggleOn && (
          <button className="btn-secondary" onClick={() => onNext({ pipelineResult: null, toggles })}>
            Skip AI — push draft to Ghost
          </button>
        )}
        {anyToggleOn && (
          <button className="btn-primary" onClick={handleRun} disabled={loading}>
            {loading ? 'Running pipeline…' : 'Run pipeline'}
          </button>
        )}
      </div>
    </div>
  );
}
